import { getSessionUser } from "./session";
import { SessionUser, Role } from "@/types";
import prisma from "@/lib/db/prisma";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied. Insufficient permissions.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Require any authenticated user session
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError("Please sign in with Discord to continue.");
  }
  return user;
}

/**
 * Require Reviewer or Admin role
 */
export async function requireReviewer(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "REVIEWER" && user.role !== "ADMIN") {
    throw new ForbiddenError("Only staff reviewers and administrators can access this resource.");
  }
  return user;
}

/**
 * Require Admin role
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Only administrators can perform this action.");
  }
  return user;
}

/**
 * IDOR Defense: Verify applicant owns the application OR user is Reviewer/Admin
 */
export async function checkApplicationAccess(
  applicationId: string,
  user: SessionUser
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { userId: true, status: true },
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  const isOwner = application.userId === user.id;
  const isStaff = user.role === "REVIEWER" || user.role === "ADMIN";

  if (!isOwner && !isStaff) {
    throw new ForbiddenError("You do not have permission to view or modify this application.");
  }

  return { application, isOwner, isStaff };
}
