"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldAlert,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const isStaff = user?.role === "REVIEWER" || user?.role === "ADMIN";
  const avatarUrl = user?.discordAvatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
    : undefined;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-[#0f1319]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary font-black text-lg transition-transform group-hover:scale-105">
              ⚡
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  VORTEX TIERS
                </span>
                <span className="rounded border border-primary/40 bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary tracking-wider uppercase font-mono">
                  STAFF
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Recruitment & Testing Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-border/50">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Dashboard
              </Link>

              <Link
                href="/apply"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith("/apply")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4 text-primary" />
                Staff Application
              </Link>

              {isStaff && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-secondary text-foreground border border-purple-500/30"
                      : "text-purple-300/80 hover:bg-secondary/50 hover:text-purple-200"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  Admin Panel
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* User Account / Login Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2.5 px-3 py-1.5 h-11 border-border/80 bg-secondary/30 hover:bg-secondary"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl} alt={user.discordUsername} />
                    <AvatarFallback>{user.discordUsername.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-foreground max-w-[120px] truncate leading-tight">
                      {user.discordGlobalName || user.discordUsername}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono leading-none">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none text-foreground">
                      {user.discordGlobalName || user.discordUsername}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground font-mono truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Applicant Dashboard
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/apply" className="cursor-pointer flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    New Application
                  </Link>
                </DropdownMenuItem>

                {isStaff && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center gap-2 text-purple-300 font-semibold">
                        <ShieldCheck className="h-4 w-4 text-purple-400" />
                        Admin Review Suite
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold gap-2">
              <Link href="/api/auth/login">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign in with Discord
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
