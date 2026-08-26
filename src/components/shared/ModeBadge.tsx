import React from "react";
import { Badge } from "@/components/ui/badge";

interface ModeBadgeProps {
  slug: string;
  name: string;
  className?: string;
}

export function ModeBadge({ slug, name, className }: ModeBadgeProps) {
  const getModeStyles = (slug: string) => {
    switch (slug.toLowerCase()) {
      case "crystal":
        return "border-purple-500/40 bg-purple-500/15 text-purple-300";
      case "neth-pot":
      case "netherite-pot":
        return "border-rose-500/40 bg-rose-500/15 text-rose-300";
      case "pot":
        return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
      case "sword":
        return "border-blue-500/40 bg-blue-500/15 text-blue-300";
      case "uhc":
        return "border-amber-500/40 bg-amber-500/15 text-amber-300";
      case "smp":
        return "border-teal-500/40 bg-teal-500/15 text-teal-300";
      case "axe":
        return "border-orange-500/40 bg-orange-500/15 text-orange-300";
      case "mace":
        return "border-indigo-500/40 bg-indigo-500/15 text-indigo-300";
      default:
        return "border-border bg-secondary/50 text-foreground";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-bold font-mono tracking-wide ${getModeStyles(
        slug
      )} ${className || ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {name}
    </span>
  );
}
