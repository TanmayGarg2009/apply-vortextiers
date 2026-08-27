"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SessionUser } from "@/types";

interface HomeHeroCTAProps {
  isApplicationsOpen: boolean;
  initialUser?: SessionUser | null;
}

export function HomeHeroCTA({ isApplicationsOpen, initialUser }: HomeHeroCTAProps) {
  const [user, setUser] = useState<SessionUser | null | undefined>(initialUser);
  const [hasDraft, setHasDraft] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // If not passed initially, check /api/auth/me to populate client-side
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user) {
            // Also check for existing draft/submission
            const appsRes = await fetch("/api/applications");
            if (appsRes.ok) {
              const appsData = await appsRes.json();
              const apps = appsData.applications || [];
              setHasDraft(apps.some((a: any) => a.status === "DRAFT" || a.status === "NEEDS_CHANGES"));
              setHasSubmitted(apps.some((a: any) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"));
            }
          }
        }
      } catch {
        // Fallback to unauthenticated state
      }
    }
    loadUser();
  }, []);

  if (user) {
    return (
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
          <Link href="/dashboard">Applicant Dashboard</Link>
        </Button>

        {(user.role === "ADMIN" || user.role === "REVIEWER") && (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold font-mono"
          >
            <Link href="/admin">Staff Review Suite 🛡️</Link>
          </Button>
        )}
      </div>
    );
  }

  if (isApplicationsOpen) {
    return (
      <Button
        asChild
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-8 h-12 gap-2 shadow-lg shadow-primary/25 font-mono"
      >
        <Link href="/api/auth/login?redirect=/apply">
          Apply Now — Discord Login <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      disabled
      size="lg"
      className="bg-muted text-muted-foreground font-bold text-sm px-8 h-12 cursor-not-allowed font-mono"
    >
      Applications Temporarily Closed
    </Button>
  );
}
