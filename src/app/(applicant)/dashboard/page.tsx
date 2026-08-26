import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ModeBadge } from "@/components/shared/ModeBadge";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login");
  }

  const applications = await dbService.getUserApplications(user.id);
  const settings = await dbService.getSettings();

  const activeDraft = applications.find((a) => a.status === "DRAFT");
  const pendingApp = applications.find(
    (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
  );
  const canStartNew = !activeDraft && !pendingApp && settings.applications_open !== false;

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Applicant Dashboard
            </h1>
            <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track your Vortex Tiers staff applications, review feedback, and manage your submissions.
          </p>
        </div>

        {canStartNew && (
          <Button asChild className="gap-2 font-bold shadow-sm shadow-primary/20">
            <Link href="/apply">
              <PlusCircle className="h-4 w-4" /> New Staff Application
            </Link>
          </Button>
        )}

        {activeDraft && (
          <Button asChild className="gap-2 font-bold bg-amber-500 hover:bg-amber-400 text-black">
            <Link href={`/apply/${activeDraft.id}`}>
              <FileText className="h-4 w-4" /> Resume Application Draft
            </Link>
          </Button>
        )}
      </div>

      {/* Applicant Discord Profile Card */}
      <div className="rounded-xl border border-border/80 bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center font-bold text-lg">
            {user.discordAvatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                alt={user.discordUsername}
                className="h-full w-full object-cover"
              />
            ) : (
              user.discordUsername.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                {user.discordGlobalName || user.discordUsername}
              </h2>
              <span className="text-xs text-muted-foreground font-mono">@{user.discordUsername}</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Discord ID: {user.discordId} • {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.role !== "APPLICANT" && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 border-purple-500/40 text-purple-300">
              <Link href="/admin">
                <Shield className="h-3.5 w-3.5" /> Staff Review Suite
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Your Staff Applications ({applications.length})
          </h2>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No staff applications submitted yet"
            description="You haven't submitted any applications. Apply today to become a Tier Tester, Moderator, or Event Staff member."
            actionHref="/apply"
            actionLabel="Start Your Application"
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-border/80 bg-card/80 hover:border-border transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-primary">
                        {app.id}
                      </span>
                      <StatusBadge status={app.status} />
                      {app.mode && (
                        <ModeBadge slug={app.mode.slug} name={app.mode.name} />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Created: {formatDate(app.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Applied Position</span>
                      <span className="font-bold text-foreground">{app.position?.name || "Staff"}</span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block">Minecraft Username</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MinecraftAvatar username={app.minecraftUsername} size={18} />
                        <span className="font-mono font-semibold text-foreground">
                          {app.minecraftUsername || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block">Submission Timestamp</span>
                      <span className="font-medium text-foreground">
                        {app.submittedAt ? formatDate(app.submittedAt) : "Not submitted (Draft)"}
                      </span>
                    </div>
                  </div>

                  {/* Decision Remarks / Rejection Feedback if reviewed */}
                  {app.status === "ACCEPTED" && app.acceptanceMessage && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                      <strong className="block mb-1 text-emerald-300 font-bold">Staff Acceptance Remarks:</strong>
                      "{app.acceptanceMessage}"
                    </div>
                  )}

                  {app.status === "REJECTED" && app.rejectionReason && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200">
                      <strong className="block mb-1 text-red-300 font-bold">Reviewer Feedback:</strong>
                      "{app.rejectionReason}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {app.status === "DRAFT"
                        ? "Draft is automatically saved. Complete submission to queue for review."
                        : app.status === "SUBMITTED"
                        ? "Application is currently in queue awaiting reviewer assignment."
                        : app.status === "UNDER_REVIEW"
                        ? "A staff member is actively reviewing your application."
                        : "Review decision finalized."}
                    </span>

                    {app.status === "DRAFT" || app.status === "NEEDS_CHANGES" ? (
                      <Button asChild size="sm" className="gap-1.5 font-bold">
                        <Link href={`/apply/${app.id}`}>
                          Continue Application <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href={`/apply/${app.id}`}>
                          View Details <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
