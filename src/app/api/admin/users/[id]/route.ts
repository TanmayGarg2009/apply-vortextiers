import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/audit/audit-logger";
import { Role } from "@/types";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();

    const { role } = body;

    if (!role || !["ADMIN", "REVIEWER", "APPLICANT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Prevent removing admin from yourself if you are the only admin
    if (targetUser.id === adminUser.id && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote yourself when you are the sole administrator." },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: role as Role },
    });

    await logAudit({
      actorId: adminUser.id,
      action: "USER_ROLE_UPDATED",
      targetType: "User",
      targetId: updatedUser.id,
      metadata: {
        fromRole: targetUser.role,
        toRole: role,
        targetUsername: targetUser.discordUsername,
        targetDiscordId: targetUser.discordId,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" || error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to update user." }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin();

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.id === adminUser.id) {
      return NextResponse.json({ error: "Cannot revoke your own access." }, { status: 400 });
    }

    // Demote to APPLICANT
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: Role.APPLICANT },
    });

    await logAudit({
      actorId: adminUser.id,
      action: "USER_ROLE_REVOKED",
      targetType: "User",
      targetId: updatedUser.id,
      metadata: {
        previousRole: targetUser.role,
        targetUsername: targetUser.discordUsername,
      },
    });

    return NextResponse.json({ success: true, message: "Staff permissions revoked." });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" || error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to revoke staff access." }, { status });
  }
}
