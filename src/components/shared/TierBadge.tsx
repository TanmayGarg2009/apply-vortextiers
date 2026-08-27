import React from "react";

interface TierBadgeProps {
  tier: string;
  className?: string;
  icon?: string;
}

const tierColorMap: Record<string, string> = {
  HT1: "bg-tier-ht1 text-white border-tier-ht1/50",
  HT2: "bg-tier-ht2 text-white border-tier-ht2/50",
  HT3: "bg-tier-ht3 text-white border-tier-ht3/50",
  HT4: "bg-tier-ht4 text-white border-tier-ht4/50",
  HT5: "bg-tier-ht4 text-white border-tier-ht4/50",
  LT1: "bg-tier-lt1 text-black font-black border-tier-lt1/50",
  LT2: "bg-tier-lt2 text-white border-tier-lt2/50",
  LT3: "bg-tier-lt3 text-white border-tier-lt3/50",
  LT4: "bg-tier-lt4 text-white border-tier-lt4/50",
  LT5: "bg-tier-lt5 text-white border-tier-lt5/50",
};

export function TierBadge({ tier, className = "", icon }: TierBadgeProps) {
  if (!tier || tier === "-" || tier === "") {
    return <span className="text-[10px] text-muted-foreground font-mono">-</span>;
  }

  const style = tierColorMap[tier] || "bg-secondary text-foreground border-border";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-black font-mono rounded px-1.5 py-0.5 border shadow-sm ${style} ${className}`}
    >
      {icon && <img src={icon} alt="" className="h-3 w-3 object-contain" />}
      {tier}
    </span>
  );
}
