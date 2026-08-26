import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ShieldAlert } from "lucide-react";

export default async function AdminAuditPage() {
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/login");
  if (user.role !== "ADMIN") redirect("/admin");

  const auditLogs = await prisma.auditLog
    .findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> System Audit Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable tracking of sensitive staff and admin operations.
          </p>
        </div>

        <span className="font-mono text-xs text-muted-foreground">
          Showing last {auditLogs.length} events
        </span>
      </div>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/70 bg-secondary/40 text-muted-foreground font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors font-mono">
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      {log.actor?.discordUsername || log.actorId || "System"}
                    </td>
                    <td className="py-3 px-4 text-primary font-semibold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {log.targetType}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">
                      {log.targetId || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
