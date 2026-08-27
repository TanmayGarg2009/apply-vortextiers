"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogoutPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, router]);

  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-[#0e1218] p-8 text-center space-y-6 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-secondary/60 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
              <img
                src="/vx-logo.jpg"
                alt="Vortex Tiers"
                className="h-16 w-16 rounded-xl object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#0e1218]">
              <CheckCircle2 className="h-4 w-4 text-black font-black" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-mono text-xl font-black uppercase text-white tracking-wide">
            Signed Out Successfully
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your session has been securely closed. Thank you for visiting the Vortex Tiers staff recruitment platform.
          </p>
        </div>

        {/* 5-Second Countdown Indicator */}
        <div className="space-y-2 rounded-xl border border-border/60 bg-[#141a24] p-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">Redirecting to home page in:</span>
            <span className="font-black text-primary text-sm">{secondsLeft}s</span>
          </div>
          <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Button
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-xs h-10 gap-2 shadow-lg shadow-primary/10"
          >
            <Link href="/">
              Return to Home Page Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-border/80 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-white font-mono text-xs h-10"
          >
            <Link href="/api/auth/login">
              Sign In Again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
