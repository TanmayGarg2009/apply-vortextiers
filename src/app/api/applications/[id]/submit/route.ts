import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkApplicationAccess } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { SubmitApplicationSchema } from "@/lib/validation/application";
import { sendApplicationEmail } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit/audit-logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { isOwner } = await checkApplicationAccess(params.id, user);

    if (!isOwner) {
      return NextResponse.json({ error: "Only the applicant can submit this application." }, { status: 403 });
    }

    const application = await dbService.getApplicationById(params.id);
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status !== "DRAFT" && application.status !== "NEEDS_CHANGES") {
      return NextResponse.json(
        { error: `This application has already been submitted (Status: ${application.status}).` },
        { status: 400 }
      );
    }

    const body = await req.json();
    SubmitApplicationSchema.parse(body);

    // Validate required questions
    const questions = await dbService.getQuestions({
      positionId: application.positionId,
      modeId: application.modeId || undefined,
      enabledOnly: true,
    });

    const answers = application.answers || [];
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

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

    // Submit and snapshot questions
    const submittedApp = await dbService.submitApplication(params.id);

    await logAudit({
      actorId: user.id,
      action: "APPLICATION_SUBMITTED",
      targetType: "Application",
      targetId: params.id,
      metadata: {
        position: submittedApp.position?.name,
        mode: submittedApp.mode?.name,
      },
    });

    // Send confirmation email asynchronously (does not block or roll back submission if email fails)
    sendApplicationEmail({
      applicationId: submittedApp.id,
      recipientEmail: submittedApp.email,
      applicantName: user.discordGlobalName || user.discordUsername,
      positionName: submittedApp.position?.name || "Staff Position",
      modeName: submittedApp.mode?.name,
      type: "APPLICATION_SUBMITTED",
    }).catch((err) => console.error("Async confirmation email error:", err));

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
