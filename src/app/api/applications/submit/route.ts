import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { SubmitApplicationSchema } from "@/lib/validation/application";
import { sendApplicationEmail } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit/audit-logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";

const DirectSubmitSchema = z.object({
  positionId: z.string().min(1, "Staff position is required."),
  modeId: z.string().optional().nullable(),
  minecraftUsername: z.string().min(2, "Minecraft username is required.").max(32),
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.string().optional().nullable(),
      selectedOptions: z.array(z.string()).optional(),
    })
  ).default([]),
  uploads: z.array(
    z.object({
      id: z.string().optional(),
      fileName: z.string().optional(),
      filename: z.string().optional(),
      fileSize: z.number().optional(),
      sizeBytes: z.number().optional(),
      mimeType: z.string().optional(),
      fileUrl: z.string().optional(),
      googleDriveViewLink: z.string().optional(),
      googleDriveFileId: z.string().optional(),
    }).transform((u) => ({
      fileName: u.fileName || u.filename || "evidence_file",
      fileSize: u.fileSize || u.sizeBytes || 0,
      mimeType: u.mimeType || "application/octet-stream",
      fileUrl: u.fileUrl || u.googleDriveViewLink || "",
      googleDriveFileId: u.googleDriveFileId || undefined,
    }))
  ).optional().default([]),
  confirmAccuracy: z.boolean().refine((val) => val === true, {
    message: "You must confirm the accuracy of your application.",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const rateLimitError = enforceRateLimit(req, "APPLICATION_SUBMIT", user.id);
    if (rateLimitError) return rateLimitError;

    // 1. Check global application status
    const settings = await dbService.getSettings();
    if (settings.applications_open === false && user.role === "APPLICANT") {
      return NextResponse.json(
        { error: "Staff applications are currently closed. Please check back later." },
        { status: 403 }
      );
    }

    // 2. Check for active application under review
    const existingApps = await dbService.getUserApplications(user.id);
    const pendingApp = existingApps.find(
      (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
    );
    if (pendingApp) {
      return NextResponse.json(
        { error: "You already have an active staff application under review." },
        { status: 400 }
      );
    }

    // 3. Check cooldown on rejected applications
    const recentRejection = existingApps.find((a) => a.status === "REJECTED");
    if (recentRejection && settings.resubmissions_allowed !== false) {
      const cooldownDays = Number(settings.cooldown_days || 14);
      const rejectedAt = new Date(recentRejection.reviewedAt || recentRejection.updatedAt).getTime();
      const elapsedDays = (Date.now() - rejectedAt) / (1000 * 60 * 60 * 24);

      if (elapsedDays < cooldownDays) {
        const remainingDays = Math.ceil(cooldownDays - elapsedDays);
        return NextResponse.json(
          {
            error: `Your previous application was reviewed recently. You can reapply in ${remainingDays} day(s).`,
          },
          { status: 429 }
        );
      }
    }

    // 4. Parse & Validate input
    const body = await req.json();
    const validated = DirectSubmitSchema.parse(body);

    // 5. Validate required questions
    const questions = await dbService.getQuestions({
      positionId: validated.positionId,
      modeId: validated.modeId || undefined,
      enabledOnly: true,
    });

    const answerMap = new Map(validated.answers.map((a) => [a.questionId, a]));
    for (const q of questions) {
      if (q.required) {
        const ans = answerMap.get(q.id);
        if (!ans || (!ans.value && (!ans.selectedOptions || ans.selectedOptions.length === 0))) {
          return NextResponse.json(
            { error: `Please answer the required question: "${q.title}"` },
            { status: 400 }
          );
        }
      }
    }

    // 6. Atomically create application directly with status SUBMITTED in database
    const submittedApp = await dbService.createSubmittedApplication({
      userId: user.id,
      discordId: user.discordId,
      email: user.email,
      positionId: validated.positionId,
      modeId: validated.modeId || null,
      minecraftUsername: validated.minecraftUsername,
      answers: validated.answers,
      uploads: validated.uploads,
    });

    // 7. Audit log
    await logAudit({
      actorId: user.id,
      action: "APPLICATION_SUBMITTED",
      targetType: "Application",
      targetId: submittedApp.id,
      metadata: {
        positionId: validated.positionId,
        modeId: validated.modeId,
        minecraftUsername: validated.minecraftUsername,
      },
    });

    // 8. Email notification (background, non-blocking)
    try {
      await sendApplicationEmail({
        applicationId: submittedApp.id,
        recipientEmail: submittedApp.email,
        applicantName: user.discordGlobalName || user.discordUsername,
        positionName: submittedApp.position?.name || "Staff Position",
        modeName: submittedApp.mode?.name,
        type: "APPLICATION_SUBMITTED",
      });
    } catch (err) {
      console.warn("Confirmation email dispatch warning:", err);
    }

    return NextResponse.json({
      success: true,
      application: submittedApp,
      message: "Application submitted successfully.",
    });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : error.name === "UnauthorizedError" ? 401 : 500;
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message || "Failed to submit application." },
      { status }
    );
  }
}
