"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  Loader2,
  ChevronDown,
  MessageCircle,
  Code2,
  Boxes,
  Shield,
  FileText,
  LogOut,
  ExternalLink,
  User,
} from "lucide-react";

interface NavbarProps {
  user?: SessionUser | null;
}

const DISCORD_SERVERS = [
  { label: "Vanilla", icon: "/icons/vanilla.svg", url: "https://discord.gg/QW3WttPERu" },
  { label: "UHC", icon: "/icons/uhc.svg", url: "https://discord.gg/FH3AkpPpYe" },
  { label: "Pot", icon: "/icons/pot.svg", url: "https://discord.gg/r3h3kwXcF2" },
  { label: "NethOP", icon: "/icons/nethop.svg", url: "https://discord.gg/8GPWhKuch8" },
  { label: "SMP", icon: "/icons/smp.svg", url: "https://discord.gg/yxqznAWqXh" },
  { label: "Sword", icon: "/icons/sword.svg", url: "https://discord.gg/RuBkcj5NxZ" },
  { label: "Axe", icon: "/icons/axe.svg", url: "https://discord.gg/r458Sx54kF" },
  { label: "Mace", icon: "/icons/mace.svg", url: "https://discord.gg/NjWpNsK96K" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [discordOpen, setDiscordOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const discordRef = useRef<HTMLDivElement>(null);
  const modRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (discordRef.current && !discordRef.current.contains(e.target as Node)) {
        setDiscordOpen(false);
      }
      if (modRef.current && !modRef.current.contains(e.target as Node)) {
        setModOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search players on Vortex Tiers API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch("https://api.vortextiers.xyz/players-api");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.players)) {
            const filtered = data.players.filter((p: any) =>
              p.username.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("Error searching players:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isAdmin = user && (user.role === "ADMIN" || user.role === "REVIEWER");

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-[#0e1218]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand with Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-black tracking-tight group">
            <img
              src="/vx-logo.jpg"
              alt="Vortex Tiers"
              className="h-7 w-7 rounded-md object-cover border border-primary/40 shadow-sm transition-transform duration-200 group-hover:scale-105"
            />
            <span className="flex items-center">
              <span className="text-primary font-black tracking-wide">Vortex</span>
              <span className="text-white">Tiers</span>
              <span className="ml-2 hidden sm:inline-block rounded bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-widest font-mono">
                APPLY
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-muted-foreground">
            <Link
              href="/"
              className={`hover:text-white transition-colors ${
                pathname === "/" ? "text-primary font-bold" : ""
              }`}
            >
              Home
            </Link>

            <a
              href="https://vortextiers.xyz"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Rankings <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            {/* Mod Dropdown */}
            <div
              className="relative"
              ref={modRef}
              onMouseEnter={() => setModOpen(true)}
              onMouseLeave={() => setModOpen(false)}
            >
              <button className="flex items-center gap-1.5 hover:text-white transition-colors py-2">
                <Boxes className="h-3.5 w-3.5" /> Mod
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    modOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {modOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 rounded-xl border border-border bg-[#161c28] shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-primary uppercase font-mono">
                    Vortex Tier Tagger Mod
                  </div>
                  <a
                    href="https://modrinth.com/mod/vortex-tier-tagger"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#1BD96A]/15 border border-[#1BD96A]/30 flex items-center justify-center font-bold text-[#1BD96A] text-xs">
                      M
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        Modrinth <span className="text-[9px] px-1 py-0.2 rounded bg-[#1BD96A]/20 text-[#1BD96A]">Official</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Download on Modrinth</div>
                    </div>
                    <span className="text-xs font-bold text-primary">GET ↗</span>
                  </a>
                  <a
                    href="https://www.curseforge.com/minecraft/mc-mods/vortex-tier-tagger"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#F16436]/15 border border-[#F16436]/30 flex items-center justify-center font-bold text-[#F16436] text-xs">
                      CF
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">CurseForge</div>
                      <div className="text-[10px] text-muted-foreground">Download on CurseForge</div>
                    </div>
                    <span className="text-xs font-bold text-primary">GET ↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Discord Dropdown */}
            <div
              className="relative"
              ref={discordRef}
              onMouseEnter={() => setDiscordOpen(true)}
              onMouseLeave={() => setDiscordOpen(false)}
            >
              <button className="flex items-center gap-1.5 hover:text-white transition-colors py-2">
                <MessageCircle className="h-3.5 w-3.5" /> Discord
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    discordOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {discordOpen && (
                <div className="absolute top-full left-0 mt-1 w-96 rounded-xl border border-border bg-[#161c28] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-primary uppercase font-mono">
                    Gamemode Discord Networks
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {DISCORD_SERVERS.map((server) => (
                      <a
                        key={server.label}
                        href={server.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                      >
                        <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center p-1">
                          <img src={server.icon} alt={server.label} className="h-full w-full object-contain" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{server.label}</span>
                      </a>
                    ))}
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-border/50 px-1">
                    <a
                      href="https://discord.gg/kjsMpEPdNe"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <img src="/vx-logo.jpg" alt="Vortex Hub" className="h-5 w-5 rounded" />
                        <span className="text-xs font-bold text-primary">Main Vortex Discord Hub</span>
                      </div>
                      <span className="text-[11px] font-mono text-primary font-bold">JOIN ↗</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <Link
                href="/dashboard"
                className={`hover:text-white transition-colors ${
                  pathname.startsWith("/dashboard") ? "text-primary font-bold" : ""
                }`}
              >
                Dashboard
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold ${
                  pathname.startsWith("/admin") ? "underline" : ""
                }`}
              >
                <Shield className="h-3.5 w-3.5" /> Staff Suite
              </Link>
            )}
          </div>
        </div>

        {/* Right: Player Search & Auth Profile */}
        <div className="flex items-center gap-3">
          {/* Live Player Search */}
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player / tiers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="h-8 w-44 lg:w-52 rounded-lg border border-border bg-secondary/40 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:w-60 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {showResults && searchQuery && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-[#161c28] shadow-2xl p-2 z-50">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching players...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No ranked player found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((player) => (
                      <a
                        key={player.id || player.username}
                        href={`https://vortextiers.xyz`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                      >
                        <img
                          src={`https://mc-heads.net/avatar/${player.username}/32`}
                          alt={player.username}
                          className="h-6 w-6 rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white truncate block">
                            {player.username}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {player.title || "Player"} • {player.region || "NA"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-primary">
                          {player.points || 0} pts
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/40 px-2.5 py-1 hover:border-border transition-colors">
                <div className="h-6 w-6 rounded-full overflow-hidden border border-border flex items-center justify-center text-[10px] font-bold bg-primary/20 text-primary">
                  {user.discordAvatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                      alt={user.discordUsername}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.discordUsername.substring(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-bold text-foreground hidden sm:inline truncate max-w-[100px]">
                  {user.discordGlobalName || user.discordUsername}
                </span>
              </Link>

              <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-white">
                <a href="/api/auth/logout" title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              size="sm"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs h-8 gap-1.5 shadow-sm shadow-[#5865F2]/20"
            >
              <a href="/api/auth/login">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign In
              </a>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
