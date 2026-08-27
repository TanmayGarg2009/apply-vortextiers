"use client";

import React, { useState, useEffect, memo } from "react";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { TierBadge } from "@/components/shared/TierBadge";
import { Loader2, CheckCircle2, Trophy, Globe, UserCheck, Sparkles } from "lucide-react";
import { findPlayerByUsername, PlayerRecord } from "@/lib/players";

interface PlayerTierPreviewProps {
  username: string;
}

export const PlayerTierPreview = memo(function PlayerTierPreview({ username }: PlayerTierPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerRecord | null>(null);

  useEffect(() => {
    if (!username || username.length < 3) {
      setPlayerData(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await findPlayerByUsername(username);
        if (active) {
          setPlayerData(found);
        }
      } catch (err) {
        console.error("Error looking up player tiers:", err);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  if (!username || username.length < 3) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-[#0d1117] p-5 shadow-2xl shadow-primary/5 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        {/* Left: Full 3D Skin Render + Identity Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 w-full md:w-auto">
          {/* Full Skin Display Box */}
          <div className="relative flex items-center justify-center h-36 w-24 sm:h-40 sm:w-28 rounded-xl bg-[#141a24] border border-border/80 p-2 shadow-inner overflow-hidden flex-shrink-0 group">
            <div className="absolute inset-0 bg-radial from-primary/10 to-transparent pointer-events-none" />
            <MinecraftAvatar username={username} type="body" className="h-full" />
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-mono font-black text-xl text-white tracking-wide">
                {username}
              </span>
              {loading ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground font-mono">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" /> Querying API...
                </span>
              ) : playerData ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Tiered Player
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                  <UserCheck className="h-3 w-3" /> Java Player Profile
                </span>
              )}
            </div>

            {playerData ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                  <span className="rounded bg-primary/20 border border-primary/40 px-2 py-0.5 text-primary font-bold">
                    {playerData.title || "Combat Player"}
                  </span>
                  <span className="rounded bg-secondary/80 border border-border px-2 py-0.5 text-foreground">
                    🏆 {playerData.points || 0} Tier Points
                  </span>
                  <span className="rounded bg-secondary/80 border border-border px-2 py-0.5 text-foreground">
                    🌐 Region: {playerData.region || "NA"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Official Vortex Tiers roster record linked to this application.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-sans max-w-sm">
                Minecraft Java profile detected. Even if you are not yet tiered on the leaderboard, you can apply for staff positions!
              </p>
            )}
          </div>
        </div>

        {/* Right: Verified Tiers Grid */}
        {playerData && playerData.tiers && (
          <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground">
              Official Discipline Tiers
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 max-w-xs">
              {Object.entries(playerData.tiers).map(([mode, tier]: [string, any]) => {
                if (!tier || tier === "-" || mode === "overall" || mode === "ltm") return null;
                return (
                  <div
                    key={mode}
                    className="flex flex-col items-center rounded-lg border border-border/80 bg-[#141a24] px-2 py-1 gap-0.5"
                  >
                    <span className="text-[9px] uppercase font-mono text-muted-foreground font-semibold">
                      {mode}
                    </span>
                    <TierBadge tier={tier} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
