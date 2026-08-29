import React, { Suspense } from "react";
import Link from "next/link";
import dbService from "@/lib/db/store";
import { ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ModeBadge } from "@/components/shared/ModeBadge";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { formatDate } from "@/lib/utils";
import {
  FileSpreadsheet,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Globe,
  Swords,
  Users,
} from "lucide-react";

interface ApplicationsPageProps {
  searchParams: {
    query?: string;
    division?: string;
    status?: ApplicationStatus;
    positionId?: string;
    modeId?: string;
    page?: string;
  };
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-8 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-primary font-mono text-xs">
        <Loader2 className="h-4 w-4 animate-spin" />
        Streaming applications...
      </div>
      <div className="space-y-2 max-w-xl mx-auto">
        <div className="h-6 bg-secondary/50 rounded animate-pulse" />
        <div className="h-6 bg-secondary/30 rounded animate-pulse" />
        <div className="h-6 bg-secondary/20 rounded animate-pulse" />
      </div>
    </div>
  );
}

async function ApplicationsTableData({
  query,
  division,
  status,
  positionId,
  modeId,
  page,
  limit,
}: {
  query: string;
  division?: string;
  status?: ApplicationStatus;
  positionId?: string;
  modeId?: string;
  page: number;
  limit: number;
}) {
  const result = await dbService.searchApplications({
    query,
    division: division === "ALL" ? undefined : division,
    status,
    positionId,
    modeId,
    page,
    limit,
  });

  return (
    <div className="rounded-2xl border border-border/80 bg-[#121721] overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="border-b border-border/70 bg-[#0e1218] text-muted-foreground uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Dossier ID</th>
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Division</th>
              <th className="py-3 px-4">Position</th>
              <th className="py-3 px-4">PvP Mode</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Submitted At</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {result.applications.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <div className="space-y-1.5">
                    <p className="font-bold text-white">No active candidate applications match your criteria.</p>
                    <p className="text-[11px]">Try adjusting your search query, division, or status filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              result.applications.map((app) => {
                const isTiers =
                  app.modeId !== null ||
                  app.position?.slug === "tier-tester" ||
                  app.position?.slug === "screensharer" ||
                  app.position?.slug === "tiers-helper";

                return (
                  <tr key={app.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {app.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <MinecraftAvatar username={app.minecraftUsername} size={24} />
                        <div className="flex flex-col">
                          <span className="font-bold text-white font-mono">
                            {app.minecraftUsername || app.user?.discordUsername || app.discordId}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {app.user?.discordUsername ? `@${app.user.discordUsername}` : app.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isTiers ? (
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          Vortex Tiers
                        </span>
                      ) : (
                        <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                          Vortex Network
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-white">
                      {app.position?.name || "Staff"}
                    </td>

                    <td className="py-3.5 px-4">
                      {app.mode ? (
                        <ModeBadge slug={app.mode.slug} name={app.mode.name} />
                      ) : isTiers ? (
                        <span className="rounded bg-secondary/80 border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          All Modes
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>

                    <td suppressHydrationWarning className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {formatDate(app.submittedAt || app.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs font-mono font-bold">
                        <Link href={`/admin/applications/${app.id}`}>
                          Inspect <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border/70 bg-[#0e1218]">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-bold text-white">{result.applications.length}</span> of{" "}
            <span className="font-bold text-white">{result.total}</span> applications
          </p>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
              className="h-8 text-xs font-mono"
            >
              <Link
                href={`/admin/applications?page=${page - 1}&division=${division || "ALL"}&status=${status || ""}&query=${encodeURIComponent(
                  query
                )}&positionId=${positionId || ""}&modeId=${modeId || ""}`}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Link>
            </Button>

            <span className="text-xs text-muted-foreground px-2 font-mono">
              Page {page} of {result.totalPages}
            </span>

            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= result.totalPages}
              className="h-8 text-xs font-mono"
            >
              <Link
                href={`/admin/applications?page=${page + 1}&division=${division || "ALL"}&status=${status || ""}&query=${encodeURIComponent(
                  query
                )}&positionId=${positionId || ""}&modeId=${modeId || ""}`}
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function AdminApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const query = searchParams.query || "";
  const division = searchParams.division || "ALL";
  const status = searchParams.status;
  const positionId = searchParams.positionId;
  const modeId = searchParams.modeId;
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 15;

  const [positions, gameModes] = await Promise.all([
    dbService.getStaffPositions(),
    dbService.getGameModes(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" /> Candidate ATS Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Filter, search, evaluate, and manage candidate dossiers across Vortex Network & Vortex Tiers.
          </p>
        </div>
      </div>

      {/* Division Selector Tabs */}
      <div className="flex items-center rounded-xl bg-[#0e1218] p-1.5 border border-border/80 w-full sm:w-auto">
        <Link
          href={`/admin/applications?division=ALL&status=${status || ""}&query=${encodeURIComponent(query)}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            division === "ALL"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Globe className="h-4 w-4" /> All Divisions
        </Link>
        <Link
          href={`/admin/applications?division=NETWORK&status=${status || ""}&query=${encodeURIComponent(query)}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            division === "NETWORK"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Globe className="h-4 w-4 text-blue-400" /> Vortex Network (Server)
        </Link>
        <Link
          href={`/admin/applications?division=TIERS&status=${status || ""}&query=${encodeURIComponent(query)}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            division === "TIERS"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Swords className="h-4 w-4 text-amber-400" /> Vortex Tiers (Tierlist)
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-[#121721] p-4 shadow-md">
        <form method="GET" action="/admin/applications" className="flex flex-col lg:flex-row gap-3">
          <input type="hidden" name="division" value={division} />

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search by candidate IGN, Discord username, or ID..."
              className="pl-9 bg-[#0e1218] border-border text-xs font-mono text-white placeholder:text-muted-foreground h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Select */}
            <select
              name="status"
              defaultValue={status || ""}
              className="h-9 rounded-md border border-border bg-[#0e1218] px-3 py-1 text-xs text-white font-mono focus:border-primary focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="UNDER_DISCUSSION">Under Discussion</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_CHANGES">Needs Changes</option>
            </select>

            {/* Position Select */}
            <select
              name="positionId"
              defaultValue={positionId || ""}
              className="h-9 rounded-md border border-border bg-[#0e1218] px-3 py-1 text-xs text-white font-mono focus:border-primary focus:outline-none"
            >
              <option value="">All Roles</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Game Mode Select */}
            <select
              name="modeId"
              defaultValue={modeId || ""}
              className="h-9 rounded-md border border-border bg-[#0e1218] px-3 py-1 text-xs text-white font-mono focus:border-primary focus:outline-none"
            >
              <option value="">All Game Modes</option>
              {gameModes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <Button type="submit" size="sm" className="h-9 font-mono font-bold text-xs gap-1.5">
              <Search className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Streaming Applications Table */}
      <Suspense
        key={`${query}-${division}-${status}-${positionId}-${modeId}-${page}`}
        fallback={<TableSkeleton />}
      >
        <ApplicationsTableData
          query={query}
          division={division}
          status={status}
          positionId={positionId}
          modeId={modeId}
          page={page}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}
