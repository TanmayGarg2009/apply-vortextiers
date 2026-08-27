import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { Button } from "@/components/ui/button";
import { ModeBadge } from "@/components/shared/ModeBadge";
import {
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Flame,
  Gamepad2,
  Users,
  Award,
  Swords,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import { HomeHeroCTA } from "@/components/home/HomeHeroCTA";

export const revalidate = 300;

interface HomePageProps {
  searchParams?: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
    auth_error?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // If Discord redirected directly to root domain with ?code=..., forward to the API Route Handler where cookies can be set
  if (searchParams?.code) {
    const callbackUrl = `/api/auth/callback?code=${encodeURIComponent(searchParams.code)}${
      searchParams.state ? `&state=${encodeURIComponent(searchParams.state)}` : ""
    }&from_root=1`;
    redirect(callbackUrl);
  }

  const [settings, positions, gameModes] = await Promise.all([
    dbService.getSettings(),
    dbService.getStaffPositions(),
    dbService.getGameModes(),
  ]);

  const safeSettings = settings || {};
  const safePositions = Array.isArray(positions) ? positions : [];
  const safeModes = Array.isArray(gameModes) ? gameModes : [];

  const isApplicationsOpen = safeSettings.applications_open !== false;
  const banner = (safeSettings.announcement_banner as string) || null;

  const roleIcons: Record<string, any> = {
    "tier-tester": Swords,
    moderator: Shield,
    "trial-staff": Users,
    "event-staff": Flame,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Auth Error Banner if present */}
      {searchParams?.auth_error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-400 font-mono flex items-center gap-2">
          <span>⚠️ {searchParams.auth_error}</span>
        </div>
      )}

      {/* Announcement Banner */}
      {banner && (
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary font-mono font-bold tracking-wide shadow-sm animate-pulse">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>{banner}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="max-w-4xl text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <img
            src="/vx-logo.jpg"
            alt="Vortex Tiers"
            className="h-16 w-16 rounded-xl object-cover border-2 border-primary/60 shadow-xl shadow-primary/20"
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase font-mono leading-tight">
            Vortex Tiers <br />
            <span className="text-primary tracking-normal">Staff Recruitment</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-sans">
            Apply to become an official <strong>Tier Tester</strong>, <strong>Moderator</strong>, or <strong>Event Staff</strong>. Help test players, score tier brackets from <strong>HT1 to LT5</strong>, and maintain competitive integrity.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <HomeHeroCTA isApplicationsOpen={isApplicationsOpen} />
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-border/80 bg-secondary/30 hover:bg-secondary/70 text-foreground font-bold font-mono"
          >
            <a href="https://vortextiers.xyz" target="_blank" rel="noreferrer">
              Official Tierlists ↗
            </a>
          </Button>
        </div>
      </div>

      {/* Staff Positions Grid */}
      <div className="w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white font-mono">
            Open Staff Roles
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            Select your discipline during application submission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {safePositions.map((pos) => {
            const Icon = roleIcons[pos.slug] || Shield;
            return (
              <div
                key={pos.id}
                className="group relative rounded-2xl border border-border/80 bg-[#121721] p-5 space-y-3 transition-all duration-200 hover:border-primary/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  {pos.requiredEvidence && (
                    <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
                      Clips Req.
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-primary transition-colors">
                    {pos.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {pos.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Supported Game Modes */}
      <div className="w-full space-y-6 text-center">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Competitive PvP Disciplines
          </h3>
          <p className="text-sm text-muted-foreground">
            Tier testing and moderation conducted across all 8 official Minecraft PvP gamemodes:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {safeModes.map((mode) => (
            <div
              key={mode.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-[#121721] p-3 hover:border-primary/50 hover:bg-secondary/40 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg bg-secondary/80 flex items-center justify-center p-1.5 group-hover:scale-110 transition-transform">
                <img
                  src={
                    mode.slug === "crystal"
                      ? "/icons/vanilla.svg"
                      : mode.slug === "neth-pot"
                      ? "/icons/nethop.svg"
                      : `/icons/${mode.slug}.svg`
                  }
                  alt={mode.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-mono text-xs font-bold text-foreground">
                {mode.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recruitment Process Stepper */}
      <div className="w-full rounded-2xl border border-border/80 bg-[#121721] p-6 sm:p-8 space-y-6">
        <h3 className="text-center font-mono text-sm font-bold uppercase tracking-widest text-white">
          Application Evaluation Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="font-mono text-xs font-bold text-primary">01. Submission</span>
            <h4 className="text-sm font-bold text-white">Identity & Question Assessment</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify your Discord account, link your Java IGN, and detail your competitive and testing background.
            </p>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <span className="font-mono text-xs font-bold text-primary">02. Review & Testing</span>
            <h4 className="text-sm font-bold text-white">Footage Inspection & 1v1 Test</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Staff review attached evidence clips and schedule an official live tier testing duel if required.
            </p>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <span className="font-mono text-xs font-bold text-primary">03. Onboarding</span>
            <h4 className="text-sm font-bold text-white">Decision Dispatch & Orientation</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive instant email notification and Discord orientation for official staff roster onboarding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
