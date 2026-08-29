import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { UpdateStatusSchema } from "@/lib/validation/application";
import { sendApplicationEmail } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit/audit-logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireReviewer();
    const rateLimitError = enforceRateLimit(req, "ADMIN_ACTION", user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const validated = UpdateStatusSchema.parse(body);

    const application = await dbService.getApplicationById(params.id);
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // Update status and record transition
    const updated = await dbService.updateApplicationStatus({
      applicationId: params.id,
      newStatus: validated.status,
      reviewerId: user.id,
      decisionReason: validated.decisionReason,
      acceptanceMessage: validated.acceptanceMessage,
      rejectionReason: validated.rejectionReason,
      note: validated.note,
    });

    await logAudit({
      actorId: user.id,
      action: `APPLICATION_STATUS_${validated.status}`,
      targetType: "Application",
      targetId: params.id,
      metadata: {
        fromStatus: application.status,
        toStatus: validated.status,
        hasAcceptanceMessage: !!validated.acceptanceMessage,
        hasRejectionReason: !!validated.rejectionReason,
      },
    });

    // Trigger corporate email notification for status changes
    try {
      const applicantDisplayName = updated.user?.discordGlobalName || updated.user?.discordUsername || "Applicant";
      const positionDisplayName = updated.position?.name || "Staff Position";

      if (validated.status === "ACCEPTED") {
        await sendApplicationEmail({
          applicationId: updated.id,
          recipientEmail: updated.email,
          applicantName: applicantDisplayName,
          positionName: positionDisplayName,
          modeName: updated.mode?.name,
          type: "APPLICATION_ACCEPTED",
          acceptanceMessage: validated.acceptanceMessage,
        });
      } else if (validated.status === "REJECTED") {
        await sendApplicationEmail({
          applicationId: updated.id,
          recipientEmail: updated.email,
          applicantName: applicantDisplayName,
          positionName: positionDisplayName,
          modeName: updated.mode?.name,
          type: "APPLICATION_REJECTED",
          rejectionReason: validated.rejectionReason,
        });
      } else if (validated.status === "UNDER_REVIEW") {
        await sendApplicationEmail({
          applicationId: updated.id,
          recipientEmail: updated.email,
          applicantName: applicantDisplayName,
          positionName: positionDisplayName,
          modeName: updated.mode?.name,
          type: "APPLICATION_UNDER_REVIEW",
          interviewNote: validated.note || validated.decisionReason,
        });
      } else if (validated.status === "NEEDS_CHANGES") {
        await sendApplicationEmail({
          applicationId: updated.id,
          recipientEmail: updated.email,
          applicantName: applicantDisplayName,
          positionName: positionDisplayName,
          modeName: updated.mode?.name,
          type: "APPLICATION_NEEDS_CHANGES",
          requestNote: validated.decisionReason || validated.note,
        });
      }
    } catch (err) {
      console.warn("Status change email dispatch note:", err);
    }

    return NextResponse.json({
      success: true,
      application: updated,
      message: `Application status updated to ${validated.status}.`,
    });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message || "Failed to update application status." },
      { status }
    );
  }
}
