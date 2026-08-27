import prisma from "@/lib/db/prisma";
import { ApplicationStatus } from "@/types";

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

async function resolveUserCuid(userIdOrDiscordId?: string | null): Promise<string | null> {
  if (!userIdOrDiscordId) return null;
  // Fast path: If already a cuid (c + 24 alphanumeric chars), return directly
  if (/^c[a-z0-9]{24}$/i.test(userIdOrDiscordId)) {
    return userIdOrDiscordId;
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userIdOrDiscordId }, { discordId: userIdOrDiscordId }],
      },
      select: { id: true },
    });
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Record an immutable audit log entry
 */
export async function logAudit(params: LogAuditParams) {
  try {
    const resolvedActorId = await resolveUserCuid(params.actorId);

    await prisma.auditLog.create({
      data: {
        actorId: resolvedActorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

/**
 * Record an application status transition in StatusHistory
 */
export async function logStatusTransition(params: {
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedById?: string | null;
  note?: string | null;
  metadata?: any;
}) {
  try {
    const resolvedChangedById = await resolveUserCuid(params.changedById);

    await prisma.statusHistory.create({
      data: {
        applicationId: params.applicationId,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        changedById: resolvedChangedById,
        note: params.note || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to record status transition:", error);
  }
}
