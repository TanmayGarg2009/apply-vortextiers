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
} from "lucide-react";

interface ApplicationsPageProps {
  searchParams: {
    query?: string;
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
  status,
  positionId,
  modeId,
  page,
  limit,
}: {
  query: string;
  status?: ApplicationStatus;
  positionId?: string;
  modeId?: string;
  page: number;
  limit: number;
}) {
  const result = await dbService.searchApplications({
    query,
    status,
    positionId,
    modeId,
    page,
    limit,
  });

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/70 bg-secondary/40 text-muted-foreground font-mono uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Application ID</th>
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Position</th>
              <th className="py-3 px-4">PvP Mode</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Submitted At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {result.applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              result.applications.map((app) => (
                <tr key={app.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {app.id}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <MinecraftAvatar username={app.minecraftUsername} size={22} />
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {app.user?.discordGlobalName || app.user?.discordUsername || app.discordId}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                          {app.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-foreground">
                    {app.position?.name || "Staff"}
                  </td>

                  <td className="py-3.5 px-4">
                    {app.mode ? (
                      <ModeBadge slug={app.mode.slug} name={app.mode.name} />
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={app.status} />
                  </td>

                  <td suppressHydrationWarning className="py-3.5 px-4 font-mono text-muted-foreground">
                    {formatDate(app.submittedAt || app.createdAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1 font-semibold">
                      <Link href={`/admin/applications/${app.id}`}>
                        Review <ExternalLink className="h-3 w-3 ml-0.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/70 p-4 text-xs">
          <span className="text-muted-foreground font-mono">
            Page {page} of {result.totalPages} ({result.total} total)
          </span>

          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
              className="h-8 text-xs gap-1"
            >
              <Link
                href={`/admin/applications?page=${page - 1}&query=${encodeURIComponent(query)}&status=${status || ""}&positionId=${positionId || ""}`}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= result.totalPages}
              className="h-8 text-xs gap-1"
            >
              <Link
                href={`/admin/applications?page=${page + 1}&query=${encodeURIComponent(query)}&status=${status || ""}&positionId=${positionId || ""}`}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ApplicationsTablePage({
  searchParams,
}: ApplicationsPageProps) {
  const query = searchParams.query || "";
  const status = searchParams.status || undefined;
  const positionId = searchParams.positionId || undefined;
  const modeId = searchParams.modeId || undefined;
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 12;

  const [positions, gameModes] = await Promise.all([
    dbService.getStaffPositions(),
    dbService.getGameModes(),
  ]);

  const statuses: ApplicationStatus[] = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "ACCEPTED",
    "REJECTED",
    "DRAFT",
    "WITHDRAWN",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Applications Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Search, filter, and review incoming Vortex Tiers staff submissions.
          </p>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <Input
            name="query"
            defaultValue={query}
            placeholder="Search by Discord, IGN, App ID, or Email..."
            className="h-9 text-xs"
          />
        </div>

        {/* Status Filter */}
        <select
          name="status"
          defaultValue={status || ""}
          className="h-9 rounded-lg border border-border bg-secondary/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {/* Position Filter */}
        <select
          name="positionId"
          defaultValue={positionId || ""}
          className="h-9 rounded-lg border border-border bg-secondary/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Positions</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-9 flex-1 gap-1 font-bold text-xs">
            <Search className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs">
            <Link href="/admin/applications">Reset</Link>
          </Button>
        </div>
      </form>

      {/* Streaming Applications Table */}
      <Suspense fallback={<TableSkeleton />}>
        <ApplicationsTableData
          query={query}
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
