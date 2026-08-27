import React from "react";
import Link from "next/link";
import { Shield, ExternalLink, MessageCircle, Boxes } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-[#0a0d13] py-10 text-muted-foreground text-xs font-mono">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/vx-logo.jpg"
            alt="Vortex Tiers"
            className="h-6 w-6 rounded object-cover border border-primary/40"
          />
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">
              <span className="text-primary">VORTEX</span> TIERS
            </span>
            <span className="h-3 w-[1px] bg-border" />
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Official Staff & Recruitment Platform
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
          <a
            href="https://vortextiers.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            Tierlists <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <a
            href="https://discord.gg/kjsMpEPdNe"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <MessageCircle className="h-3 w-3" /> Discord Hub
          </a>
          <a
            href="https://modrinth.com/mod/vortex-tier-tagger"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <Boxes className="h-3 w-3" /> Tier Tagger Mod
          </a>
          <span className="text-muted-foreground/40">© {new Date().getFullYear()} Vortex Tiers</span>
        </div>
      </div>
    </footer>
  );
}
