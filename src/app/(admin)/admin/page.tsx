import React from "react";
import Link from "next/link";
import dbService from "@/lib/db/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ModeBadge } from "@/components/shared/ModeBadge";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  Gamepad2,
  Globe,
  Swords,
  Users,
} from "lucide-react";

interface AdminOverviewProps {
  searchParams?: {
    division?: "NETWORK" | "TIERS" | "ALL";
  };
}

export default async function AdminOverviewPage({ searchParams }: AdminOverviewProps) {
  const currentDivision = searchParams?.division || "ALL";

  const [metrics, recentApps, positions, gameModes] = await Promise.all([
    dbService.getMetrics(),
    dbService.searchApplications({
      division: currentDivision === "ALL" ? undefined : currentDivision,
      limit: 8,
    }),
    dbService.getStaffPositions(),
    dbService.getGameModes(),
  ]);

  const totalDecided = metrics.accepted + metrics.rejected;
  const acceptanceRate =
    totalDecided > 0 ? Math.round((metrics.accepted / totalDecided) * 100) : 0;

  const networkPositions = positions.filter(
    (p) =>
      p.slug !== "tier-tester" &&
      p.slug !== "screensharer" &&
      p.slug !== "tiers-helper" &&
      !p.name.toLowerCase().includes("tier tester")
  );

  const tierPositions = positions.filter(
    (p) =>
      p.slug === "tier-tester" ||
      p.slug === "screensharer" ||
      p.slug === "tiers-helper" ||
      p.name.toLowerCase().includes("tier") ||
      p.name.toLowerCase().includes("screenshar")
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono uppercase">
            Recruitment Command Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Real-time applicant tracking, candidate queues, and staff division metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="gap-2 font-bold font-mono text-xs shadow-lg shadow-primary/10">
            <Link href="/admin/applications">
              <FileSpreadsheet className="h-4 w-4" /> Open Full Applicant ATS
            </Link>
          </Button>
        </div>
      </div>

      {/* Division Selector Tabs */}
      <div className="flex items-center rounded-xl bg-[#0e1218] p-1.5 border border-border/80 w-full sm:w-auto">
        <Link
          href="/admin?division=ALL"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            currentDivision === "ALL"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Globe className="h-4 w-4" /> All Divisions
        </Link>
        <Link
          href="/admin?division=NETWORK"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            currentDivision === "NETWORK"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Globe className="h-4 w-4 text-blue-400" /> Vortex Network (Server)
        </Link>
        <Link
          href="/admin?division=TIERS"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            currentDivision === "TIERS"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Swords className="h-4 w-4 text-amber-400" /> Vortex Tiers (Tierlist)
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 bg-[#121721] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Pending Review
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">
                {metrics.pending}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[#121721] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Under Active Review
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-400 mt-1 font-mono">
                {metrics.underReview}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[#121721] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Accepted Staff
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">
                {metrics.accepted}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[#121721] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Acceptance Rate
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground mt-1 font-mono">
                {acceptanceRate}%
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-white font-mono uppercase">
              Candidate Dossier Stream {currentDivision !== "ALL" && `(${currentDivision === "NETWORK" ? "Vortex Network" : "Vortex Tiers"})`}
            </h2>
          </div>
          <Link
            href="/admin/applications"
            className="text-xs text-primary hover:underline font-bold font-mono flex items-center gap-1"
          >
            View all candidate dossiers ({recentApps.total}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/80 bg-[#121721] overflow-hidden shadow-xl">
          <div className="divide-y divide-border/60">
            {recentApps.applications.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-mono space-y-2">
                <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-white font-bold">No active candidate applications found in queue.</p>
                <p>New submissions will appear here automatically.</p>
              </div>
            ) : (
              recentApps.applications.map((app) => {
                const isTiers =
                  app.modeId !== null ||
                  app.position?.slug === "tier-tester" ||
                  app.position?.slug === "screensharer" ||
                  app.position?.slug === "tiers-helper";

                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <MinecraftAvatar username={app.minecraftUsername} size={36} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-mono">
                            {app.minecraftUsername || app.user?.discordUsername}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {app.user?.discordGlobalName ? `(${app.user.discordGlobalName})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-primary font-bold">
                            {app.id}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            • {app.position?.name || "Staff Role"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {isTiers ? (
                        app.mode ? (
                          <ModeBadge slug={app.mode.slug} name={app.mode.name} />
                        ) : (
                          <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
                            Tiers (All)
                          </span>
                        )
                      ) : (
                        <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 font-mono">
                          Network
                        </span>
                      )}

                      <StatusBadge status={app.status} />

                      <span suppressHydrationWarning className="text-xs text-muted-foreground font-mono">
                        {formatDate(app.submittedAt || app.createdAt)}
                      </span>

                      <Button asChild size="sm" variant="outline" className="h-7 text-xs font-mono font-bold">
                        <Link href={`/admin/applications/${app.id}`}>Inspect Dossier</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Staff Positions Roster Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/80 bg-[#121721] shadow-lg">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" /> Vortex Network Roles ({networkPositions.length})
              </CardTitle>
              <Link href="/admin/positions" className="text-[11px] text-primary hover:underline font-mono">
                Manage Roles →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {networkPositions.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0 font-mono">
                <span className="font-semibold text-white">{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.enabled ? (
                    <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                      Open
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Internal</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[#121721] shadow-lg">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Swords className="h-4 w-4 text-amber-400" /> Vortex Tiers Roles ({tierPositions.length})
              </CardTitle>
              <Link href="/admin/positions" className="text-[11px] text-primary hover:underline font-mono">
                Manage Roles →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {tierPositions.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0 font-mono">
                <span className="font-semibold text-white">{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.requiredEvidence && (
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                      Clips Req
                    </span>
                  )}
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                    Open
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
