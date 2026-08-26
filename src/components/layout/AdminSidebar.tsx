"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  ListPlus,
  ShieldAlert,
  Gamepad2,
  Settings,
  History,
  ArrowLeft,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Applications", href: "/admin/applications", icon: FileSpreadsheet },
    { label: "Question Builder", href: "/admin/questions", icon: ListPlus },
    { label: "Staff Positions", href: "/admin/positions", icon: ShieldAlert },
    { label: "Game Modes", href: "/admin/modes", icon: Gamepad2 },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    { label: "Audit Logs", href: "/admin/audit", icon: History },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border/70 bg-[#0f1319] p-4 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
            <span>🛡️</span>
            Staff Review Suite
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Recruitment & application management
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground border border-border/80 shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Applicant Portal
        </Link>
      </div>
    </aside>
  );
}
