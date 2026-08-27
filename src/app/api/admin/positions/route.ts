import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireReviewer } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { logAudit } from "@/lib/audit/audit-logger";

export async function GET() {
  try {
    await requireReviewer();
    const positions = await dbService.getStaffPositions();
    return NextResponse.json({ positions });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const position = await dbService.createStaffPosition(body);

    await logAudit({
      actorId: admin.id,
      action: "POSITION_CREATED",
      targetType: "StaffPosition",
      targetId: position.id,
      metadata: { name: position.name, slug: position.slug },
    });

    return NextResponse.json({ position }, { status: 201 });
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

    const updated = await dbService.updateStaffPosition(id, data);

    await logAudit({
      actorId: admin.id,
      action: "POSITION_UPDATED",
      targetType: "StaffPosition",
      targetId: id,
      metadata: { name: updated.name },
    });

    return NextResponse.json({ position: updated });
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

    await dbService.deleteStaffPosition(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
