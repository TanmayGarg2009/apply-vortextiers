"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  ListPlus,
  ShieldAlert,
  Gamepad2,
  Settings,
  History,
  Users,
  ArrowLeft,
  Globe,
  Swords,
  Layers,
  Sparkles,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const divisionParam = searchParams.get("division");

  // Determine active suite context: "NETWORK" or "TIERS" (defaults to "NETWORK" or "TIERS" based on divisionParam)
  const activeDivision = divisionParam === "TIERS" ? "TIERS" : "NETWORK";

  const networkNavItems = [
    { label: "Network Overview", href: "/admin?division=NETWORK", icon: LayoutDashboard, exact: true },
    { label: "Applications ATS", href: "/admin/applications?division=NETWORK", icon: FileSpreadsheet },
    { label: "Staff Roles & Hierarchy", href: "/admin/positions", icon: ShieldAlert },
    { label: "Questionnaire Builder", href: "/admin/questions", icon: ListPlus },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    { label: "Staff & Permissions", href: "/admin/users", icon: Users },
    { label: "System Audit Logs", href: "/admin/audit", icon: History },
  ];

  const tiersNavItems = [
    { label: "Tiers Overview", href: "/admin?division=TIERS", icon: LayoutDashboard, exact: true },
    { label: "Applications ATS", href: "/admin/applications?division=TIERS", icon: FileSpreadsheet },
    { label: "Tiers Positions", href: "/admin/positions", icon: ShieldAlert },
    { label: "Supported PvP Modes", href: "/admin/modes", icon: Gamepad2 },
    { label: "Questionnaire Builder", href: "/admin/questions", icon: ListPlus },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    { label: "Staff & Permissions", href: "/admin/users", icon: Users },
    { label: "System Audit Logs", href: "/admin/audit", icon: History },
  ];

  const navItems = activeDivision === "NETWORK" ? networkNavItems : tiersNavItems;

  return (
    <aside className="w-64 shrink-0 border-r border-border/70 bg-[#0c1017] p-4 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-5">
        {/* Top Suite Switcher Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest font-mono text-muted-foreground">
              Admin Suite Mode
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-black font-mono border ${
                activeDivision === "NETWORK"
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              }`}
            >
              {activeDivision === "NETWORK" ? "NETWORK SUITE" : "TIERS SUITE"}
            </span>
          </div>

          {/* 2-Suite Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#070a0f] border border-border/60">
            <Link
              href="/admin?division=NETWORK"
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all text-center ${
                activeDivision === "NETWORK"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Network</span>
            </Link>

            <Link
              href="/admin?division=TIERS"
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all text-center ${
                activeDivision === "TIERS"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Swords className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Tierlist</span>
            </Link>
          </div>
        </div>

        {/* Division Suite Identity Banner */}
        <div
          className={`p-3 rounded-xl border text-xs font-mono space-y-1 transition-all ${
            activeDivision === "NETWORK"
              ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-white">
            {activeDivision === "NETWORK" ? (
              <Globe className="h-4 w-4 text-blue-400 shrink-0" />
            ) : (
              <Swords className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <span>{activeDivision === "NETWORK" ? "Vortex Network Hub" : "Vortex Tiers Official"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans leading-tight">
            {activeDivision === "NETWORK"
              ? "Manage Minecraft server trial staff, moderation, and infrastructure."
              : "Manage competitive tier testers, screensharers, and 1v1 disciplines."}
          </p>
        </div>

        {/* Contextual Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const targetBase = item.href.split("?")[0];
            const isBaseMatch =
              item.exact
                ? pathname === targetBase
                : pathname.startsWith(targetBase) && targetBase !== "/admin";

            // If on overview route, check exact match
            const isActive =
              targetBase === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(targetBase);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold font-mono transition-all ${
                  isActive
                    ? activeDivision === "NETWORK"
                      ? "bg-blue-600/15 text-white border border-blue-500/40 shadow-sm shadow-blue-500/10"
                      : "bg-amber-600/15 text-white border border-amber-500/40 shadow-sm shadow-amber-500/10"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive
                      ? activeDivision === "NETWORK"
                        ? "text-blue-400"
                        : "text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border/50 space-y-2 font-mono">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Applicant Portal
        </Link>
      </div>
    </aside>
  );
}
