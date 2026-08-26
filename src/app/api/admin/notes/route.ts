import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { AddAdminNoteSchema } from "@/lib/validation/application";
import { logAudit } from "@/lib/audit/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const reviewer = await requireReviewer();
    const body = await req.json();
    const { applicationId, content } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId." }, { status: 400 });
    }

    const validated = AddAdminNoteSchema.parse({ content });

    const note = await dbService.addAdminNote({
      applicationId,
      authorId: reviewer.id,
      content: validated.content,
    });

    await logAudit({
      actorId: reviewer.id,
      action: "ADMIN_NOTE_ADDED",
      targetType: "Application",
      targetId: applicationId,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message || "Failed to add admin note." },
      { status }
    );
  }
}
