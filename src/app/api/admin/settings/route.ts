import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireReviewer } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { logAudit } from "@/lib/audit/audit-logger";

export async function GET() {
  try {
    await requireReviewer();
    const settings = await dbService.getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      await dbService.updateSetting(key, value, admin.id);
    }

    await logAudit({
      actorId: admin.id,
      action: "SETTINGS_UPDATED",
      targetType: "AppSetting",
      metadata: body,
    });

    const settings = await dbService.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
