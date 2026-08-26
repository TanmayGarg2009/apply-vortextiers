import React from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import dbService from "@/lib/db/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

export default async function HomePage() {
  const user = await getSessionUser();
  const settings = await dbService.getSettings();
  const positions = await dbService.getStaffPositions();
  const gameModes = await dbService.getGameModes();

  const isApplicationsOpen = settings.applications_open !== false;
  const banner = settings.announcement_banner as string;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8">
      {/* Announcement Banner */}
      {banner && (
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary font-medium">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>{banner}</span>
        </div>
      )}

      {/* Main Hero Container */}
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <span>⚡</span> Vortex Tiers Staff Recruitment
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Join the Staff Team of <br />
          <span className="text-primary">Vortex Tiers</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          We are recruiting dedicated Tier Testers, Moderators, and Event Staff to evaluate player skill levels, maintain competitive integrity, and run official community tournaments.
        </p>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Button asChild size="lg" className="gap-2 font-bold px-8 h-12 text-base">
              <Link href="/dashboard">
                Go to Applicant Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : isApplicationsOpen ? (
            <Button
              asChild
              size="lg"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold gap-3 px-8 h-12 text-base shadow-lg shadow-[#5865F2]/20"
            >
              <Link href="/api/auth/login">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Continue with Discord to Apply
              </Link>
            </Button>
          ) : (
            <Button disabled size="lg" variant="outline" className="gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" /> Applications Currently Closed
            </Button>
          )}

          <Button asChild variant="outline" size="lg" className="h-12 border-border/80">
            <a href="https://vortextiers.xyz" target="_blank" rel="noreferrer">
              View Tierlist Rankings
            </a>
          </Button>
        </div>
      </div>

      {/* Available Staff Positions Grid */}
      <div className="mt-16 w-full max-w-5xl space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight text-white">Open Staff Roles</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose your specialty when submitting your application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {positions.map((pos) => (
            <Card key={pos.id} className="border-border/80 bg-card/60 hover:bg-card hover:border-border transition-all">
              <CardContent className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{pos.name}</span>
                  {pos.requiredEvidence && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      Evidence
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pos.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Supported PvP Game Modes */}
      <div className="mt-12 w-full max-w-5xl space-y-4 text-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Supported Competitive PvP Game Modes
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {gameModes.map((mode) => (
            <ModeBadge key={mode.id} slug={mode.slug} name={mode.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
