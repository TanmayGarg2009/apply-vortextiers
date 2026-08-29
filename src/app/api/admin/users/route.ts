import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/rbac";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/audit/audit-logger";
import { Role } from "@/types";
import { fetchDiscordUser } from "@/lib/auth/discord";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const role = url.searchParams.get("role");

    const where: any = {};

    // Default to STAFF (Admins and Reviewers) unless explicitly requesting ALL or APPLICANT
    if (!role || role === "STAFF") {
      where.role = { in: [Role.ADMIN, Role.REVIEWER] };
    } else if (role === "ADMIN" || role === "REVIEWER" || role === "APPLICANT") {
      where.role = role as Role;
    } else if (role === "ALL") {
      // No role filter
    }

    if (search) {
      where.OR = [
        { discordUsername: { contains: search, mode: "insensitive" } },
        { discordGlobalName: { contains: search, mode: "insensitive" } },
        { discordId: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        _count: {
          select: {
            applications: true,
            reviewedApps: true,
            adminNotes: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" || error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch users." }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();

    const { discordId, discordUsername, role, email } = body;

    if (!discordId || !discordId.trim()) {
      return NextResponse.json({ error: "Discord Snowflake User ID is required." }, { status: 400 });
    }

    const cleanDiscordId = discordId.trim();

    // Look up real Discord user profile
    const fetchedProfile = await fetchDiscordUser(cleanDiscordId);

    const cleanUsername = (
      discordUsername ||
      fetchedProfile?.username ||
      `User_${cleanDiscordId.slice(-4)}`
    ).trim();

    const cleanGlobalName = fetchedProfile?.globalName || null;
    const cleanAvatar = fetchedProfile?.avatar || null;
    const cleanRole: Role = role === "ADMIN" ? Role.ADMIN : role === "REVIEWER" ? Role.REVIEWER : Role.APPLICANT;
    const cleanEmail = (email || `${cleanDiscordId}@vortextiers.discord`).trim();

    const user = await prisma.user.upsert({
      where: { discordId: cleanDiscordId },
      update: {
        role: cleanRole,
        discordUsername: cleanUsername,
        discordGlobalName: cleanGlobalName,
        discordAvatar: cleanAvatar,
      },
      create: {
        discordId: cleanDiscordId,
        discordUsername: cleanUsername,
        discordGlobalName: cleanGlobalName,
        discordAvatar: cleanAvatar,
        role: cleanRole,
        email: cleanEmail,
      },
    });

    await logAudit({
      actorId: adminUser.id,
      action: "USER_ROLE_UPDATED",
      targetType: "User",
      targetId: user.id,
      metadata: {
        assignedRole: cleanRole,
        targetDiscordId: cleanDiscordId,
        targetUsername: cleanUsername,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" || error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to add/update user." }, { status });
  }
}
