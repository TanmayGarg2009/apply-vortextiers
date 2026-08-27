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
  UserCheck,
  Flame,
  Swords,
  Trophy,
} from "lucide-react";

import { DashboardDraftBanner } from "@/components/applicant/DashboardDraftBanner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/login");
  }

  const [applications, settings] = await Promise.all([
    dbService.getUserApplications(user.id),
    dbService.getSettings(),
  ]);
  const isApplicationsOpen = settings.applications_open !== false;

  // Filter out any legacy drafts from the submitted list
  const submittedApps = applications.filter((a) => a.status !== "DRAFT");

  // Find latest Minecraft username used
  const latestIGN = submittedApps[0]?.minecraftUsername || null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8 px-4 sm:px-6 lg:px-8">
      {/* Local Draft Banner if active */}
      <DashboardDraftBanner userId={user.id} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono uppercase">
              Applicant Dashboard
            </h1>
            <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Vortex Tiers candidate portal. Monitor recruitment progress and submit staff applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isApplicationsOpen && (
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-xs h-10 px-5 gap-2 shadow-lg shadow-primary/20">
              <Link href="/apply">
                <PlusCircle className="h-4 w-4" /> + Apply for Staff
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Applicant Passport Profile */}
      <div className="rounded-2xl border border-border/80 bg-[#121721] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl overflow-hidden border border-border bg-secondary/80 flex items-center justify-center font-bold text-lg text-primary shadow-sm flex-shrink-0">
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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-mono">
                {user.discordGlobalName || user.discordUsername}
              </h2>
              <span className="rounded bg-[#5865F2]/15 border border-[#5865F2]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#5865F2] font-mono">
                Discord Auth
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              ID: {user.discordId} • {user.email || "No email on record"}
            </p>
          </div>
        </div>

        {latestIGN && (
          <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-[#0e1218] px-4 py-2.5">
            <MinecraftAvatar username={latestIGN} type="head" size={36} />
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground block font-bold">
                Linked Java IGN
              </span>
              <span className="text-xs font-bold font-mono text-primary">
                {latestIGN}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Application History
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {applications.length} Total Record(s)
          </span>
        </div>

        {submittedApps.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-muted-foreground" />}
            title="No applications submitted yet"
            description="You haven't submitted any staff applications yet. Select a discipline and apply."
            actionLabel="Start Staff Application"
            actionHref="/apply"
          />
        ) : (
          <div className="space-y-4">
            {submittedApps.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-border/80 bg-[#121721] p-5 space-y-4 shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    {app.minecraftUsername && (
                      <MinecraftAvatar username={app.minecraftUsername} size={36} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {app.position?.name || "General Staff"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                          {app.id}
                        </span>
                      </div>
                      <span suppressHydrationWarning className="text-xs text-muted-foreground font-mono block mt-0.5">
                        Created {formatDate(app.createdAt)} {app.submittedAt && `• Submitted ${formatDate(app.submittedAt)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.mode && (
                      <ModeBadge slug={app.mode.slug} name={app.mode.name} />
                    )}
                    <StatusBadge status={app.status} />
                  </div>
                </div>

                {/* Review Notes / Decision Feedback for applicant */}
                {(app.decisionReason || app.acceptanceMessage || app.rejectionReason) && (app.status === "ACCEPTED" || app.status === "REJECTED") && (
                  <div className="rounded-xl border border-border/70 bg-[#0e1218] p-3.5 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                      Staff Decision Feedback
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                      {app.acceptanceMessage || app.rejectionReason || app.decisionReason}
                    </p>
                  </div>
                )}

                {/* Action button */}
                <div className="flex justify-end pt-1">
                  {app.status === "DRAFT" ? (
                    <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs">
                      <Link href={`/apply/${app.id}`}>
                        Resume Editing <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="font-mono text-xs border-border/80 bg-secondary/30 hover:bg-secondary/70">
                      <Link href={`/apply/${app.id}`}>
                        View Submission Snapshot <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
