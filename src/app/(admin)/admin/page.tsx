import React from "react";
import Link from "next/link";
import dbService from "@/lib/db/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ModeBadge } from "@/components/shared/ModeBadge";
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
} from "lucide-react";

export default async function AdminOverviewPage() {
  const [metrics, recentApps, positions, gameModes] = await Promise.all([
    dbService.getMetrics(),
    dbService.searchApplications({ limit: 6 }),
    dbService.getStaffPositions(),
    dbService.getGameModes(),
  ]);

  const totalDecided = metrics.accepted + metrics.rejected;
  const acceptanceRate =
    totalDecided > 0 ? Math.round((metrics.accepted / totalDecided) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Staff Applications Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time recruitment metrics, application queues, and quick operational shortcuts.
          </p>
        </div>

        <Button asChild className="gap-2 font-bold">
          <Link href="/admin/applications">
            <FileSpreadsheet className="h-4 w-4" /> View All Applications
          </Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 bg-card/80">
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

        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Under Review
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

        <Card className="border-border/80 bg-card/80">
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

        <Card className="border-border/80 bg-card/80">
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
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Applications Queue
          </h2>
          <Link
            href="/admin/applications"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            View all ({recentApps.total}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="divide-y divide-border/60">
            {recentApps.applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No staff applications in queue.
              </div>
            ) : (
              recentApps.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-primary">
                      {app.id}
                    </span>
                    <span className="font-semibold text-sm text-foreground">
                      {app.user?.discordGlobalName || app.user?.discordUsername || app.discordId}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({app.position?.name || "Staff"})
                    </span>
                    {app.mode && (
                      <ModeBadge slug={app.mode.slug} name={app.mode.name} />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <span suppressHydrationWarning className="text-xs text-muted-foreground font-mono">
                      {formatDate(app.submittedAt || app.createdAt)}
                    </span>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link href={`/admin/applications/${app.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Staff Positions & Game Modes Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Active Staff Positions ({positions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {positions.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                <span className="font-semibold text-foreground">{p.name}</span>
                <span className="text-muted-foreground font-mono">Order: {p.order}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" /> Supported PvP Modes ({gameModes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-1">
            {gameModes.map((m) => (
              <ModeBadge key={m.id} slug={m.slug} name={m.name} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
