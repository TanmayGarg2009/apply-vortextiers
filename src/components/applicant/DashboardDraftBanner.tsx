"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Trash2 } from "lucide-react";

export function DashboardDraftBanner({ userId }: { userId: string }) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftPos, setDraftPos] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`vortex_local_draft_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
        if (parsed.positionId) setDraftPos(parsed.positionId);
      }
    } catch {}
  }, [userId]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(`vortex_local_draft_${userId}`);
      setHasDraft(false);
    } catch {}
  };

  if (!hasDraft) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 animate-in fade-in duration-200 shadow-lg shadow-amber-500/5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-300 font-mono">
            Unfinished Draft Application Stored Locally
          </p>
          <p className="text-[11px] text-muted-foreground">
            You have saved answers from your previous session on this device.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          className="h-8 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Link href="/apply">
            Resume <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDraft}
          className="h-8 text-xs text-muted-foreground hover:text-red-400 gap-1"
        >
          <Trash2 className="h-3 w-3" /> Discard
        </Button>
      </div>
    </div>
  );
}
