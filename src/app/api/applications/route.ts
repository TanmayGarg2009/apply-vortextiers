import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { CreateDraftSchema } from "@/lib/validation/application";
import { logAudit } from "@/lib/audit/audit-logger";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);

    // If staff user requesting all applications via admin query
    if ((user.role === "REVIEWER" || user.role === "ADMIN") && url.searchParams.get("admin") === "true") {
      const query = url.searchParams.get("query") || undefined;
      const status = (url.searchParams.get("status") as any) || undefined;
      const positionId = url.searchParams.get("positionId") || undefined;
      const modeId = url.searchParams.get("modeId") || undefined;
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "15", 10);

      const result = await dbService.searchApplications({
        query,
        status,
        positionId,
        modeId,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    // Default: return user's own applications
    const applications = await dbService.getUserApplications(user.id);
    return NextResponse.json({ applications });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch applications." }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // 1. Check if applications are globally open
    const settings = await dbService.getSettings();
    if (settings.applications_open === false && user.role === "APPLICANT") {
      return NextResponse.json(
        { error: "Staff applications are currently closed. Please check back later." },
        { status: 403 }
      );
    }

    // 2. Check for active draft or cooldown
    const existingApps = await dbService.getUserApplications(user.id);
    const activeDraft = existingApps.find((a) => a.status === "DRAFT");
    if (activeDraft) {
      return NextResponse.json({ application: activeDraft, message: "Resumed existing draft." });
    }

    const pendingApp = existingApps.find(
      (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
    );
    if (pendingApp) {
      return NextResponse.json(
        { error: "You already have an active staff application under review." },
        { status: 400 }
      );
    }

    // Check cooldown for rejected applications
    const recentRejection = existingApps.find((a) => a.status === "REJECTED");
    if (recentRejection && settings.resubmissions_allowed !== false) {
      const cooldownDays = Number(settings.cooldown_days || 14);
      const rejectedAt = new Date(recentRejection.reviewedAt || recentRejection.updatedAt).getTime();
      const elapsedDays = (Date.now() - rejectedAt) / (1000 * 60 * 60 * 24);

      if (elapsedDays < cooldownDays) {
        const remainingDays = Math.ceil(cooldownDays - elapsedDays);
        return NextResponse.json(
          {
            error: `Your previous application was reviewed recently. You can reapply in ${remainingDays} day(s).`,
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const validated = CreateDraftSchema.parse(body);

    const newApp = await dbService.createDraft({
      userId: user.id,
      discordId: user.discordId,
      email: user.email,
      positionId: validated.positionId,
      modeId: validated.modeId,
      minecraftUsername: validated.minecraftUsername,
    });

    await logAudit({
      actorId: user.id,
      action: "APPLICATION_DRAFT_CREATED",
      targetType: "Application",
      targetId: newApp.id,
      metadata: { positionId: validated.positionId, modeId: validated.modeId },
    });

    return NextResponse.json({ application: newApp }, { status: 201 });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : error.name === "UnauthorizedError" ? 401 : 500;
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message || "Failed to create application draft." },
      { status }
    );
  }
}
