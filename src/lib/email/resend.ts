import { Resend } from "resend";
import prisma from "@/lib/db/prisma";
import { EmailType, EmailStatus, SessionUser } from "@/types";
import {
  renderSubmittedEmail,
  renderAcceptedEmail,
  renderRejectedEmail,
} from "./templates";
import { logAudit } from "@/lib/audit/audit-logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_mock_resend_api_key";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@vortextiers.xyz";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://apply.vortextiers.xyz";

export const resend = new Resend(RESEND_API_KEY);

interface SendApplicationEmailParams {
  applicationId: string;
  recipientEmail: string;
  applicantName: string;
  positionName: string;
  modeName?: string | null;
  type: EmailType;
  acceptanceMessage?: string | null;
  rejectionReason?: string | null;
}

/**
 * Dispatch application email asynchronously and record dedicated EmailEvent in DB.
 * The application decision is NEVER rolled back if email fails.
 */
export async function sendApplicationEmail(params: SendApplicationEmailParams) {
  // 1. Create or retrieve pending EmailEvent record
  const emailEvent = await prisma.emailEvent.create({
    data: {
      applicationId: params.applicationId,
      recipient: params.recipientEmail,
      type: params.type,
      status: "PENDING" as EmailStatus,
      provider: "RESEND",
    },
  });

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
      default:
        throw new Error(`Unknown email type: ${params.type}`);
    }

    // In local dev/testing if mock/placeholder key is used
    if (RESEND_API_KEY.includes("mock") || RESEND_API_KEY.includes("your_resend") || RESEND_API_KEY.includes("PLACEHOLDER")) {
      console.log(`[Email Simulation] To: ${params.recipientEmail}, Subject: ${emailContent.subject}`);
      // Simulate send
      await prisma.emailEvent.update({
        where: { id: emailEvent.id },
        data: {
          status: "SENT" as EmailStatus,
          sentAt: new Date(),
          providerMessageId: `sim_${Date.now()}`,
        },
      });
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

    if (response.error) {
      throw new Error(response.error.message || "Resend API error");
    }

    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: {
        status: "SENT" as EmailStatus,
        sentAt: new Date(),
        providerMessageId: response.data?.id || null,
      },
    });

    return { success: true, messageId: response.data?.id };
  } catch (error: any) {
    console.error("Email delivery failed:", error);
    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: {
        status: "FAILED" as EmailStatus,
        failedAt: new Date(),
        error: error.message || "Unknown delivery error",
      },
    });

    return { success: false, error: error.message };
  }
}

/**
 * Admin retry for failed or existing email event
 */
export async function retryEmailSend(emailEventId: string, actor: SessionUser) {
  const existingEvent = await prisma.emailEvent.findUnique({
    where: { id: emailEventId },
    include: {
      application: {
        include: {
          position: true,
          mode: true,
          user: true,
        },
      },
    },
  });

  if (!existingEvent) {
    throw new Error("Email event record not found.");
  }

  const app = existingEvent.application;

  // Record audit log
  await logAudit({
    actorId: actor.id,
    action: "EMAIL_RETRIED",
    targetType: "EmailEvent",
    targetId: emailEventId,
    metadata: {
      applicationId: app.id,
      emailType: existingEvent.type,
      recipient: existingEvent.recipient,
      previousAttempts: existingEvent.attempts,
    },
  });

  // Increment attempts on the event
  await prisma.emailEvent.update({
    where: { id: emailEventId },
    data: {
      attempts: { increment: 1 },
      status: "PENDING" as EmailStatus,
      error: null,
    },
  });

  // Attempt send
  return await sendApplicationEmail({
    applicationId: app.id,
    recipientEmail: existingEvent.recipient,
    applicantName: app.user?.discordGlobalName || app.user?.discordUsername || "Applicant",
    positionName: app.position.name,
    modeName: app.mode?.name,
    type: existingEvent.type,
    acceptanceMessage: app.acceptanceMessage,
    rejectionReason: app.rejectionReason,
  });
}
