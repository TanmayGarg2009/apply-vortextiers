"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import { SessionUser } from "@/types";

interface HomeHeroCTAProps {
  isApplicationsOpen: boolean;
  initialUser?: SessionUser | null;
}

export function HomeHeroCTA({ isApplicationsOpen, initialUser }: HomeHeroCTAProps) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SessionUser | null | undefined>(initialUser);
  const [hasDraft, setHasDraft] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user) {
            // Check local draft first
            const localDraft = localStorage.getItem(`vortex_local_draft_${data.user.id}`);
            if (localDraft) {
              setHasDraft(true);
            }

            // Check submitted applications from API
            const appsRes = await fetch("/api/applications");
            if (appsRes.ok) {
              const appsData = await appsRes.json();
              const apps = appsData.applications || [];
              if (apps.some((a: any) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW")) {
                setHasSubmitted(true);
              }
            }
          }
        }
      } catch {
        // Fallback to unauthenticated state
      }
    }
    loadUser();
  }, []);

  // During SSR and initial client hydration, render static matching button
  if (!mounted || !user) {
    if (isApplicationsOpen) {
      return (
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-8 h-12 gap-2 shadow-lg shadow-primary/25 font-mono transition-all duration-200 hover:scale-[1.02]"
        >
          <Link href="/api/auth/login?redirect_to=/apply">
            Apply Now — Discord Login <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    }

    return (
      <Button
        disabled
        size="lg"
        variant="outline"
        className="gap-2 text-muted-foreground font-mono h-12 px-8"
      >
        <Lock className="h-4 w-4" /> Applications Paused
      </Button>
    );
  }

  // Once mounted on client with user session
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-200">
      <Button
        asChild
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-8 h-12 gap-2 shadow-lg shadow-primary/25 font-mono transition-all duration-200 hover:scale-[1.02]"
      >
        <Link href={hasDraft ? "/apply" : hasSubmitted ? "/dashboard" : "/apply"}>
          {hasDraft
            ? "Resume Local Draft"
            : hasSubmitted
            ? "View Application Status"
            : "Start Application"}{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        size="lg"
        className="h-12 border-border/80 bg-secondary/30 hover:bg-secondary/70 text-foreground font-bold font-mono transition-all duration-200 hover:scale-[1.02]"
      >
        <Link href="/dashboard">Applicant Dashboard</Link>
      </Button>

      {(user.role === "ADMIN" || user.role === "REVIEWER") && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold font-mono transition-all duration-200 hover:scale-[1.02]"
        >
          <Link href="/admin">Staff Review Suite 🛡️</Link>
        </Button>
      )}
    </div>
  );
}
