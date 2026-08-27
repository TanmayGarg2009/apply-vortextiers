import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-16 px-4 text-center space-y-6 max-w-md mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl shadow-red-500/10">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
          404 — Record Not Found
        </span>
        <h1 className="text-2xl font-black text-white font-mono uppercase tracking-tight">
          Page or Application Missing
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
          The application record or page you requested could not be located. It may have been archived, removed, or you may not have authorization to view it.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button asChild size="sm" variant="outline" className="font-mono text-xs gap-1.5 h-9">
          <Link href="/">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
        </Button>
        <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-xs gap-1.5 h-9">
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
