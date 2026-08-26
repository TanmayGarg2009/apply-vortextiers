import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireReviewer } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { logAudit } from "@/lib/audit/audit-logger";

export async function GET() {
  try {
    const modes = await dbService.getGameModes();
    return NextResponse.json({ modes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const mode = await dbService.createGameMode(body);

    await logAudit({
      actorId: admin.id,
      action: "GAME_MODE_CREATED",
      targetType: "GameMode",
      targetId: mode.id,
      metadata: { name: mode.name, slug: mode.slug },
    });

    return NextResponse.json({ mode }, { status: 201 });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...data } = body;

    const updated = await dbService.updateGameMode(id, data);

    await logAudit({
      actorId: admin.id,
      action: "GAME_MODE_UPDATED",
      targetType: "GameMode",
      targetId: id,
      metadata: { name: updated.name },
    });

    return NextResponse.json({ mode: updated });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID." }, { status: 400 });

    await dbService.deleteGameMode(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
