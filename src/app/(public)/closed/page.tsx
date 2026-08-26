import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

export default function ClosedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary/50 text-muted-foreground mb-6">
        <Lock className="h-8 w-8 text-primary" />
      </div>

      <h1 className="text-3xl font-black tracking-tight text-white mb-2">
        Staff Applications Are Closed
      </h1>

      <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-8">
        We are not currently accepting new staff applications at this time. Announcements regarding future recruitment waves will be posted in our official Discord server.
      </p>

      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Return to Home
          </Link>
        </Button>
        <Button asChild>
          <a href="https://vortextiers.xyz" target="_blank" rel="noreferrer">
            Visit Vortex Tiers
          </a>
        </Button>
      </div>
    </div>
  );
}
