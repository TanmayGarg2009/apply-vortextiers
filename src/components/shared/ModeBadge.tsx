import React from "react";

interface ModeBadgeProps {
  slug: string;
  name: string;
  className?: string;
  showIcon?: boolean;
}

const modeIconMap: Record<string, string> = {
  crystal: "/icons/vanilla.svg",
  vanilla: "/icons/vanilla.svg",
  "neth-pot": "/icons/nethop.svg",
  "netherite-pot": "/icons/nethop.svg",
  nethop: "/icons/nethop.svg",
  pot: "/icons/pot.svg",
  sword: "/icons/sword.svg",
  uhc: "/icons/uhc.svg",
  smp: "/icons/smp.svg",
  axe: "/icons/axe.svg",
  mace: "/icons/mace.svg",
  ltm: "/icons/ltm.svg",
  overall: "/icons/overall.svg",
};

export function ModeBadge({ slug, name, className = "", showIcon = true }: ModeBadgeProps) {
  const icon = modeIconMap[slug.toLowerCase()] || "/icons/sword.svg";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-2.5 py-1 text-xs font-bold text-foreground font-mono transition-all hover:border-primary/50 hover:bg-secondary/70 ${className}`}
    >
      {showIcon && (
        <div className="h-4 w-4 rounded-full bg-secondary/80 flex items-center justify-center flex-shrink-0">
          <img src={icon} alt={name} className="h-3 w-3 object-contain" />
        </div>
      )}
      <span>{name}</span>
    </span>
  );
}
