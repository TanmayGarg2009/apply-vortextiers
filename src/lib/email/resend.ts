import { Resend } from "resend";
import prisma from "@/lib/db/prisma";
import { EmailType, EmailStatus, SessionUser } from "@/types";
import {
  renderSubmittedEmail,
  renderUnderReviewEmail,
  renderUnderDiscussionEmail,
  renderAcceptedEmail,
  renderRejectedEmail,
  renderNeedsChangesEmail,
} from "./templates";
import { logAudit } from "@/lib/audit/audit-logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_mock_resend_api_key";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Vortex Recruitment <recruitment@vortextiers.xyz>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://apply.vortextiers.xyz";

export const resend = new Resend(RESEND_API_KEY);

export type ExtendedEmailType =
  | EmailType
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_UNDER_REVIEW"
  | "APPLICATION_UNDER_DISCUSSION"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_NEEDS_CHANGES";

interface SendApplicationEmailParams {
  applicationId: string;
  recipientEmail: string;
  applicantName: string;
  positionName: string;
  modeName?: string | null;
  type: ExtendedEmailType;
  acceptanceMessage?: string | null;
  rejectionReason?: string | null;
  interviewNote?: string | null;
  requestNote?: string | null;
}

/**
 * Dispatch application email asynchronously and record dedicated EmailEvent in DB.
 * The application decision is NEVER rolled back if email fails.
 */
export async function sendApplicationEmail(params: SendApplicationEmailParams) {
  // Map extended types to safe schema EmailType
  const schemaType: EmailType =
    params.type === "APPLICATION_ACCEPTED"
      ? "APPLICATION_ACCEPTED"
      : params.type === "APPLICATION_REJECTED"
      ? "APPLICATION_REJECTED"
      : params.type === "APPLICATION_SUBMITTED"
      ? "APPLICATION_SUBMITTED"
      : "STAFF_NOTIFICATION";

  // 1. Create or retrieve pending EmailEvent record
  let emailEvent: any = null;
  try {
    emailEvent = await prisma.emailEvent.create({
      data: {
        applicationId: params.applicationId,
        recipient: params.recipientEmail,
        type: schemaType,
        status: "PENDING" as EmailStatus,
        provider: "RESEND",
      },
    });
  } catch (err) {
    console.warn("EmailEvent record creation note:", err);
  }

  try {
    let emailContent: { subject: string; html: string; text: string };

    switch (params.type) {
      case "APPLICATION_SUBMITTED":
        emailContent = renderSubmittedEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
        });
        break;
      case "APPLICATION_UNDER_REVIEW":
        emailContent = renderUnderReviewEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
        });
        break;
      case "APPLICATION_UNDER_DISCUSSION":
        emailContent = renderUnderDiscussionEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
          interviewNote: params.interviewNote,
        });
        break;
      case "APPLICATION_ACCEPTED":
        emailContent = renderAcceptedEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
          acceptanceMessage: params.acceptanceMessage,
        });
        break;
      case "APPLICATION_REJECTED":
        emailContent = renderRejectedEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
          rejectionReason: params.rejectionReason,
        });
        break;
      case "APPLICATION_NEEDS_CHANGES":
        emailContent = renderNeedsChangesEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
          requestNote: params.requestNote,
        });
        break;
      default:
        emailContent = renderSubmittedEmail({
          applicantName: params.applicantName,
          applicationId: params.applicationId,
          positionName: params.positionName,
          modeName: params.modeName,
          appUrl: APP_URL,
        });
        break;
    }

    // In local dev/testing if mock/placeholder key is used
    if (
      RESEND_API_KEY.includes("mock") ||
      RESEND_API_KEY.includes("your_resend") ||
      RESEND_API_KEY.includes("PLACEHOLDER")
    ) {
      console.log(`[Email Simulation] To: ${params.recipientEmail}, Subject: ${emailContent.subject}`);
      if (emailEvent) {
        await prisma.emailEvent.update({
          where: { id: emailEvent.id },
          data: {
            status: "SENT" as EmailStatus,
            sentAt: new Date(),
            providerMessageId: `sim_${Date.now()}`,
          },
        }).catch(() => {});
      }
      return { success: true, messageId: `sim_${Date.now()}` };
    }

    // Live send via Resend
    const response = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: params.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailEvent) {
      await prisma.emailEvent.update({
        where: { id: emailEvent.id },
        data: {
          status: "SENT" as EmailStatus,
          sentAt: new Date(),
          providerMessageId: response.data?.id || `resend_${Date.now()}`,
        },
      }).catch(() => {});
    }

    return { success: true, messageId: response.data?.id };
  } catch (error: any) {
    console.error("Resend email dispatch error:", error);

    if (emailEvent) {
      await prisma.emailEvent.update({
        where: { id: emailEvent.id },
        data: {
          status: "FAILED" as EmailStatus,
          failedAt: new Date(),
          error: error.message || "Failed to dispatch email.",
        },
      }).catch(() => {});
    }

    return { success: false, error: error.message };
  }
}

/**
 * Admin retry helper to re-send failed or pending email events
 */
export async function retryEmailSend(emailEventId: string, actor?: SessionUser) {
  const event = await prisma.emailEvent.findUnique({
    where: { id: emailEventId },
    include: {
      application: {
        include: {
          user: true,
          position: true,
          mode: true,
        },
      },
    },
  });

  if (!event || !event.application) {
    throw new Error("Email event or associated application not found.");
  }

  const app = event.application;
  const applicantName = app.user?.discordGlobalName || app.user?.discordUsername || "Applicant";
  const positionName = app.position?.name || "Staff Position";
  const modeName = app.mode?.name;

  const result = await sendApplicationEmail({
    applicationId: app.id,
    recipientEmail: event.recipient,
    applicantName,
    positionName,
    modeName,
    type: event.type as ExtendedEmailType,
  });

  if (actor) {
    await logAudit({
      actorId: actor.id,
      action: "EMAIL_RETRY_TRIGGERED",
      targetType: "EmailEvent",
      targetId: event.id,
      metadata: {
        recipient: event.recipient,
        type: event.type,
        success: result.success,
      },
    }).catch(() => {});
  }

  return result;
}
