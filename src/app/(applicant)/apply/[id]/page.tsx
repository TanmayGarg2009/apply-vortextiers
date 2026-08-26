import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { ApplicationWizard } from "@/components/applicant/ApplicationWizard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ModeBadge } from "@/components/shared/ModeBadge";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login");
  }

  const application = await dbService.getApplicationById(params.id);
  if (!application) {
    notFound();
  }

  // IDOR Protection: Applicant can only access own application
  const isOwner = application.userId === user.id;
  const isStaff = user.role === "REVIEWER" || user.role === "ADMIN";

  if (!isOwner && !isStaff) {
    redirect("/dashboard");
  }

  const positions = await dbService.getStaffPositions();
  const gameModes = await dbService.getGameModes();
  const questions = await dbService.getQuestions();

  // If Draft or Needs Changes, show the Interactive Form Wizard
  if (application.status === "DRAFT" || application.status === "NEEDS_CHANGES") {
    return (
      <ApplicationWizard
        user={user}
        initialApplication={application}
        positions={positions}
        gameModes={gameModes}
        questions={questions}
      />
    );
  }

  // Otherwise, show the Read-Only Submitted Status Tracker
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-border/70 pb-5">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">Status:</span>
          <StatusBadge status={application.status} />
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-black text-primary">
                {application.id}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Submitted {formatDate(application.submittedAt)}
              </span>
            </div>
            {application.mode && (
              <ModeBadge slug={application.mode.slug} name={application.mode.name} />
            )}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {application.position?.name || "Staff"} Application
          </CardTitle>
          <CardDescription>
            {application.position?.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Discord Identity</span>
              <span className="font-bold text-foreground">
                {application.user?.discordGlobalName || application.user?.discordUsername}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Minecraft Username</span>
              <div className="flex items-center gap-2 mt-0.5">
                <MinecraftAvatar username={application.minecraftUsername} size={18} />
                <span className="font-mono font-bold text-foreground">
                  {application.minecraftUsername || "Not provided"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Contact Email</span>
              <span className="font-mono text-foreground text-xs">{application.email}</span>
            </div>
          </div>

          {/* Decision Outcome Banner */}
          {application.status === "ACCEPTED" && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                Application Accepted
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Congratulations! Your staff application has been accepted. Please check Discord for your orientation.
              </p>
              {application.acceptanceMessage && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20 text-xs italic text-emerald-100">
                  "{application.acceptanceMessage}"
                </div>
              )}
            </div>
          )}

          {application.status === "REJECTED" && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <Clock className="h-5 w-5" />
                Application Reviewed & Rejected
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed">
                Thank you for applying. We are unable to offer you a position at this time. You can reapply after the cooldown period.
              </p>
              {application.rejectionReason && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-xs text-red-100">
                  <strong className="block mb-1 text-red-300">Feedback:</strong>
                  "{application.rejectionReason}"
                </div>
              )}
            </div>
          )}

          {/* Submitted Answers (Rendered from question snapshot for historical integrity) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Submitted Responses
            </h3>

            <div className="space-y-3">
              {(application.answers || []).map((ans) => {
                const q = ans.questionSnapshot || ans.question;
                return (
                  <div
                    key={ans.id || ans.questionId}
                    className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-1.5"
                  >
                    <span className="text-xs font-bold text-muted-foreground font-mono">
                      {q?.title || "Question"}
                    </span>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {ans.value || (ans.selectedOptions ? ans.selectedOptions.join(", ") : "No response provided")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attached Files */}
          {(application.uploads || []).length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Uploaded Evidence Files
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {application.uploads?.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/30 p-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{f.filename}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{f.category}</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <a href={`/api/drive/file/${f.googleDriveFileId}`} target="_blank" rel="noreferrer">
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
