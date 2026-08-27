import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkApplicationAccess } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { SaveDraftSchema } from "@/lib/validation/application";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await checkApplicationAccess(params.id, user);

    const application = await dbService.getApplicationById(params.id);
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch application." }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const rateLimitError = enforceRateLimit(req, "APPLICATION_AUTOSAVE", user.id);
    if (rateLimitError) return rateLimitError;

    const { application, isOwner } = await checkApplicationAccess(params.id, user);

    if (!isOwner) {
      return NextResponse.json({ error: "Only the applicant can edit draft answers." }, { status: 403 });
    }

    if (application.status !== "DRAFT" && application.status !== "NEEDS_CHANGES") {
      return NextResponse.json(
        { error: `Application is already ${application.status} and cannot be modified.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = SaveDraftSchema.parse(body);

    await dbService.saveDraftAnswers(params.id, validated.answers, {
      minecraftUsername: validated.minecraftUsername,
      modeId: validated.modeId,
      positionId: validated.positionId,
    });

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : error.name === "UnauthorizedError" ? 401 : 500;
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message || "Failed to save draft." },
      { status }
    );
  }
}
