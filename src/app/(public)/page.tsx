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

  const user = await getSessionUser();
  const settings = await dbService.getSettings();
  const positions = await dbService.getStaffPositions();
  const gameModes = await dbService.getGameModes();

  let userApps: any[] = [];
  if (user) {
    userApps = await dbService.getUserApplications(user.id);
  }
  const hasDraft = userApps.some((a) => a.status === "DRAFT" || a.status === "NEEDS_CHANGES");
  const hasSubmitted = userApps.some((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW");

  const isApplicationsOpen = settings.applications_open !== false;
  const banner = settings.announcement_banner as string;

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
          {user ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-8 h-12 gap-2 shadow-lg shadow-primary/25 font-mono"
              >
                <Link href={hasDraft ? "/apply" : hasSubmitted ? "/dashboard" : "/apply"}>
                  {hasDraft
                    ? "Resume Draft Application"
                    : hasSubmitted
                    ? "View Application Status"
                    : "Start a New Application"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-border/80 bg-secondary/30 hover:bg-secondary/70 text-foreground font-bold font-mono"
              >
                <Link href="/dashboard">
                  Applicant Dashboard
                </Link>
              </Button>

              {(user.role === "ADMIN" || user.role === "REVIEWER") && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold font-mono"
                >
                  <Link href="/admin">
                    Staff Review Suite 🛡️
                  </Link>
                </Button>
              )}
            </div>
          ) : isApplicationsOpen ? (
            <Button
              asChild
              size="lg"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-sm gap-3 px-8 h-12 shadow-xl shadow-[#5865F2]/25 font-mono"
            >
              <Link href="/api/auth/login?redirect_to=/apply">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign In with Discord to Apply
              </Link>
            </Button>
          ) : (
            <Button disabled size="lg" variant="outline" className="gap-2 text-muted-foreground font-mono">
              <Lock className="h-4 w-4" /> Applications Paused
            </Button>
          )}

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
          {positions.map((pos) => {
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
          {gameModes.map((mode) => (
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
