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
  ChevronRight,
  Boxes,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  Sparkles,
  Download,
  ShieldCheck,
  Gamepad2,
  Globe,
  Swords,
  Users,
  CheckCircle2,
  Flame,
  Layers,
} from "lucide-react";
import { searchPlayers } from "@/lib/players";

interface NavbarProps {
  user?: SessionUser | null;
}

const DISCORD_SERVERS = [
  { label: "Vanilla", icon: "/icons/vanilla.svg", url: "https://discord.gg/QW3WttPERu", color: "from-blue-500/20 to-indigo-500/20" },
  { label: "UHC", icon: "/icons/uhc.svg", url: "https://discord.gg/FH3AkpPpYe", color: "from-amber-500/20 to-yellow-500/20" },
  { label: "Pot", icon: "/icons/pot.svg", url: "https://discord.gg/r3h3kwXcF2", color: "from-purple-500/20 to-pink-500/20" },
  { label: "NethOP", icon: "/icons/nethop.svg", url: "https://discord.gg/8GPWhKuch8", color: "from-red-500/20 to-orange-500/20" },
  { label: "SMP", icon: "/icons/smp.svg", url: "https://discord.gg/yxqznAWqXh", color: "from-emerald-500/20 to-teal-500/20" },
  { label: "Sword", icon: "/icons/sword.svg", url: "https://discord.gg/RuBkcj5NxZ", color: "from-cyan-500/20 to-blue-500/20" },
  { label: "Axe", icon: "/icons/axe.svg", url: "https://discord.gg/r458Sx54kF", color: "from-rose-500/20 to-red-500/20" },
  { label: "Mace", icon: "/icons/mace.svg", url: "https://discord.gg/NjWpNsK96K", color: "from-violet-500/20 to-purple-500/20" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [discordOpen, setDiscordOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDiscordOpen, setMobileDiscordOpen] = useState(false);
  const [mobileModOpen, setMobileModOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const discordRef = useRef<HTMLDivElement>(null);
  const modRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const discordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDiscordEnter = () => {
    if (discordTimerRef.current) clearTimeout(discordTimerRef.current);
    setDiscordOpen(true);
  };

  const handleDiscordLeave = () => {
    discordTimerRef.current = setTimeout(() => {
      setDiscordOpen(false);
    }, 200);
  };

  const handleModEnter = () => {
    if (modTimerRef.current) clearTimeout(modTimerRef.current);
    setModOpen(true);
  };

  const handleModLeave = () => {
    modTimerRef.current = setTimeout(() => {
      setModOpen(false);
    }, 200);
  };

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (discordTimerRef.current) clearTimeout(discordTimerRef.current);
      if (modTimerRef.current) clearTimeout(modTimerRef.current);
    };
  }, []);

  // Search players on Vortex Tiers API with instant response
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlayers(searchQuery, 6);
        if (active) {
          setSearchResults(results);
        }
      } catch (err) {
        console.error("Error searching players:", err);
      } finally {
        if (active) setSearching(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const isAdmin = user && (user.role === "ADMIN" || user.role === "REVIEWER");

  return (
    <nav className="sticky top-0 z-50 border-b border-border/80 bg-[#0a0e16]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand with Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-black tracking-tight group">
            <img
              src="/vx-logo.jpg"
              alt="Vortex Tiers"
              className="h-7 w-7 rounded-lg object-cover border border-primary/40 shadow-sm transition-transform duration-200 group-hover:scale-105"
            />
            <span className="flex items-center">
              <span className="text-primary font-black tracking-wide">Vortex</span>
              <span className="text-white">Tiers</span>
              <span className="ml-2 hidden sm:inline-block rounded-md bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-widest font-mono">
                APPLY
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-muted-foreground font-mono">
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
              onMouseEnter={handleModEnter}
              onMouseLeave={handleModLeave}
            >
              <button
                onClick={() => setModOpen(!modOpen)}
                className={`flex items-center gap-1.5 hover:text-white transition-colors py-2 cursor-pointer ${
                  modOpen ? "text-primary font-bold" : ""
                }`}
              >
                <Boxes className="h-3.5 w-3.5 text-primary" /> Mod
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    modOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {modOpen && (
                <div
                  onMouseEnter={handleModEnter}
                  onMouseLeave={handleModLeave}
                  className="absolute top-full left-0 mt-1.5 w-84 rounded-2xl border border-white/10 bg-[#0d121c]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-3 space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                        Vortex Tier Tagger
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono font-bold">
                      v1.4.2
                    </span>
                  </div>

                  {/* Modrinth Card */}
                  <a
                    href="https://modrinth.com/mod/vortex-tier-tagger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-[#070a10] hover:border-[#1BD96A]/60 hover:bg-[#1BD96A]/10 transition-all group/mod"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1BD96A]/15 border border-[#1BD96A]/30 flex items-center justify-center flex-shrink-0 p-1.5">
                      <img src="https://modrinth.com/favicon.ico" alt="Modrinth" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 font-mono">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        Modrinth <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1BD96A]/20 text-[#1BD96A] font-semibold">Recommended</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-sans">Instant 1-Click Install</div>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground group-hover/mod:text-[#1BD96A] transition-colors" />
                  </a>

                  {/* CurseForge Card */}
                  <a
                    href="https://www.curseforge.com/minecraft/mc-mods/vortex-tier-tagger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-[#070a10] hover:border-[#F16436]/60 hover:bg-[#F16436]/10 transition-all group/cf"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#F16436]/15 border border-[#F16436]/30 flex items-center justify-center flex-shrink-0 p-1.5">
                      <img src="https://www.curseforge.com/favicon.ico" alt="CurseForge" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 font-mono">
                      <div className="text-xs font-bold text-white">CurseForge</div>
                      <div className="text-[10px] text-muted-foreground font-sans">CurseForge App & Manual JAR</div>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground group-hover/cf:text-[#F16436] transition-colors" />
                  </a>

                  {/* Feature Pill Footer */}
                  <div className="p-2.5 bg-[#05080e] border border-border/60 rounded-xl space-y-1 text-[11px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-white font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Dynamic nametags & tier icons
                    </div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Supported on Fabric 1.20 - 1.21.x with automatic tier score synchronization.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Discord Dropdown */}
            <div
              className="relative"
              ref={discordRef}
              onMouseEnter={handleDiscordEnter}
              onMouseLeave={handleDiscordLeave}
            >
              <button
                onClick={() => setDiscordOpen(!discordOpen)}
                className={`flex items-center gap-1.5 hover:text-white transition-colors py-2 cursor-pointer ${
                  discordOpen ? "text-[#5865F2] font-bold" : ""
                }`}
              >
                <svg className="h-3.5 w-3.5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    discordOpen ? "rotate-180 text-[#5865F2]" : ""
                  }`}
                />
              </button>

              {discordOpen && (
                <div
                  onMouseEnter={handleDiscordEnter}
                  onMouseLeave={handleDiscordLeave}
                  className="absolute top-full left-0 mt-1.5 w-96 rounded-2xl border border-white/10 bg-[#0d121c]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-3 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase font-mono">
                      Gamemode Discord Communities
                    </span>
                    <span className="text-[9px] font-mono text-[#5865F2] font-bold">
                      8 Communities
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {DISCORD_SERVERS.map((server) => (
                      <a
                        key={server.label}
                        href={server.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-border/50 bg-[#070a10] hover:border-primary/50 hover:bg-white/5 transition-all group/dc"
                      >
                        <div className="h-7 w-7 rounded-lg bg-secondary/80 border border-border/80 flex items-center justify-center p-1 group-hover/dc:scale-105 transition-transform flex-shrink-0">
                          <img src={server.icon} alt={server.label} className="h-full w-full object-contain" />
                        </div>
                        <span className="text-xs font-mono font-semibold text-white group-hover/dc:text-primary transition-colors truncate">
                          {server.label}
                        </span>
                      </a>
                    ))}
                  </div>

                  {/* Main Network Discord Hub */}
                  <div className="pt-2 border-t border-border/60">
                    <a
                      href="https://discord.gg/kjsMpEPdNe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#5865F2]/20 to-primary/20 border border-[#5865F2]/40 hover:border-[#5865F2] transition-all group/vx"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/vx-logo.jpg" alt="Vortex Hub" className="h-7 w-7 rounded-lg object-cover border border-white/20" />
                        <div className="font-mono">
                          <span className="text-xs font-bold text-white block leading-none">
                            Vortex Network Discord
                          </span>
                          <span className="text-[10px] text-muted-foreground font-sans">
                            Main Server Hub & Announcements
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#5865F2] font-black group-hover/vx:translate-x-0.5 transition-transform bg-[#5865F2]/20 px-2 py-1 rounded-md border border-[#5865F2]/40">
                        JOIN ↗
                      </span>
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
                className={`flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-bold px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 ${
                  pathname.startsWith("/admin") ? "ring-1 ring-purple-500/60" : ""
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
              className="h-8 w-44 lg:w-52 rounded-xl border border-border bg-[#070a10] pl-8 pr-7 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:w-60 transition-all font-mono"
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
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#0d121c]/95 backdrop-blur-2xl shadow-2xl p-2 z-50">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground font-mono">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching players...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground font-mono">
                    No ranked player found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-1 font-mono">
                    {searchResults.map((player) => (
                      <a
                        key={player.id || player.username}
                        href={`https://vortextiers.xyz`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors"
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
                          <span className="text-[10px] text-muted-foreground">
                            {player.title || "Player"} • {player.region || "NA"}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-primary">
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
            <div className="flex items-center gap-2 font-mono">
              <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-border/80 bg-[#070a10] px-2.5 py-1 hover:border-primary/50 transition-colors">
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
                <span className="text-xs font-bold text-white hidden sm:inline truncate max-w-[100px]">
                  {user.discordGlobalName || user.discordUsername}
                </span>
              </Link>

              <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-white hidden sm:flex">
                <a href="/api/auth/logout" title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              size="sm"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold font-mono text-xs h-8 gap-1.5 shadow-sm shadow-[#5865F2]/20"
            >
              <a href="/api/auth/login">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign In
              </a>
            </Button>
          )}

          {/* Mobile Hamburger Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-[#0a0e16]/98 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150 font-mono">
          {/* Mobile Player Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player / tiers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              className="h-9 w-full rounded-xl border border-border bg-[#070a10] pl-8 pr-7 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Nav Links List */}
          <div className="space-y-1 text-xs">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                pathname === "/" ? "bg-white/10 text-primary font-bold" : "text-muted-foreground hover:text-white"
              }`}
            >
              Home
            </Link>

            <a
              href="https://vortextiers.xyz"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:text-white transition-colors"
            >
              <span>Rankings</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>

            {/* Mobile Mod Accordion */}
            <div className="rounded-xl border border-border/60 bg-[#070a10] overflow-hidden">
              <button
                onClick={() => setMobileModOpen(!mobileModOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-white font-bold text-xs"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="h-3.5 w-3.5 text-primary" />
                  <span>Vortex Tier Tagger Mod</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mobileModOpen ? "rotate-180 text-primary" : ""}`} />
              </button>

              {mobileModOpen && (
                <div className="px-3 pb-3 space-y-2 pt-1 border-t border-border/40">
                  <a
                    href="https://modrinth.com/mod/vortex-tier-tagger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs text-white"
                  >
                    <span>Download on Modrinth</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1BD96A]/20 text-[#1BD96A] font-bold">Recommended</span>
                  </a>
                  <a
                    href="https://www.curseforge.com/minecraft/mc-mods/vortex-tier-tagger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs text-white"
                  >
                    <span>Download on CurseForge</span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Discord Accordion */}
            <div className="rounded-xl border border-border/60 bg-[#070a10] overflow-hidden">
              <button
                onClick={() => setMobileDiscordOpen(!mobileDiscordOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-white font-bold text-xs"
              >
                <div className="flex items-center gap-2 text-[#5865F2]">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>Discord Communities</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mobileDiscordOpen ? "rotate-180 text-[#5865F2]" : ""}`} />
              </button>

              {mobileDiscordOpen && (
                <div className="px-3 pb-3 space-y-1.5 pt-1 border-t border-border/40">
                  <a
                    href="https://discord.gg/kjsMpEPdNe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#5865F2]/20 text-[#5865F2] font-bold text-xs"
                  >
                    <span>Vortex Network Discord Hub</span>
                    <span>JOIN ↗</span>
                  </a>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {DISCORD_SERVERS.map((s) => (
                      <a
                        key={s.label}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 text-xs text-white"
                      >
                        <img src={s.icon} alt={s.label} className="h-4 w-4 object-contain" />
                        <span>{s.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-white"
              >
                Dashboard
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-purple-400 bg-purple-500/10 font-bold border border-purple-500/30"
              >
                <Shield className="h-3.5 w-3.5" /> Staff Suite
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
