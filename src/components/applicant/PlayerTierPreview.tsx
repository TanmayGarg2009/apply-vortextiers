"use client";

import React, { useState, useEffect } from "react";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { TierBadge } from "@/components/shared/TierBadge";
import { Loader2, CheckCircle2, ShieldAlert, Trophy, Globe } from "lucide-react";

interface PlayerTierPreviewProps {
  username: string;
}

export function PlayerTierPreview({ username }: PlayerTierPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<any | null>(null);

  useEffect(() => {
    if (!username || username.length < 3) {
      setPlayerData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api.vortextiers.xyz/players-api");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.players)) {
            const found = data.players.find(
              (p: any) => p.username.toLowerCase() === username.toLowerCase()
            );
            setPlayerData(found || null);
          }
        }
      } catch (err) {
        console.error("Error looking up player tiers:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  if (!username || username.length < 3) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-[#121722]/90 p-4 shadow-lg animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Skin Bust + Username & Title */}
        <div className="flex items-center gap-3.5">
          <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary/40 border border-border flex items-center justify-center p-1">
            <MinecraftAvatar username={username} type="bust" size={48} />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base text-white">
                {username}
              </span>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : playerData ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                  <CheckCircle2 className="h-3 w-3" /> Ranked Player
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-secondary/80 border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground font-mono">
                  New Contender
                </span>
              )}
            </div>

            {playerData ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="text-primary font-bold">{playerData.title || "Combat Player"}</span>
                <span>•</span>
                <span>{playerData.points || 0} Points</span>
                <span>•</span>
                <span>Region: {playerData.region || "NA"}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Minecraft Java profile detected.
              </p>
            )}
          </div>
        </div>

        {/* Current Verified Tiers Display */}
        {playerData && playerData.tiers && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
            {Object.entries(playerData.tiers).map(([mode, tier]: [string, any]) => {
              if (!tier || tier === "-" || mode === "overall" || mode === "ltm") return null;
              return (
                <div key={mode} className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] uppercase font-mono text-muted-foreground font-semibold">
                    {mode}
                  </span>
                  <TierBadge tier={tier} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
