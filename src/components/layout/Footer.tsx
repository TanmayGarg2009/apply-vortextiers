import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-[#0c1016] py-8 text-muted-foreground text-xs">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">VORTEX TIERS</span>
          <span className="h-3 w-[1px] bg-border" />
          <span>Minecraft PvP Tiering & Staff Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://vortextiers.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Main Tierlist
          </a>
          <a
            href="https://verify.vortextiers.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Discord Verification
          </a>
          <span className="text-muted-foreground/50">© 2026 Vortex Tiers</span>
        </div>
      </div>
    </footer>
  );
}
