import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border border-border text-foreground",
        // Status Variants
        draft: "border border-muted bg-muted/40 text-muted-foreground",
        submitted: "border border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold",
        under_review: "border border-blue-500/40 bg-blue-500/15 text-blue-300 font-semibold",
        accepted: "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-bold",
        rejected: "border border-red-500/40 bg-red-500/15 text-red-400 font-semibold",
        withdrawn: "border border-gray-500/40 bg-gray-500/15 text-gray-400",
        needs_changes: "border border-orange-500/40 bg-orange-500/15 text-orange-300",
        // Mode & Role Badges
        gold: "border border-amber-400/40 bg-amber-400/15 text-amber-300 font-bold",
        admin: "border border-purple-500/40 bg-purple-500/15 text-purple-300 font-bold",
        reviewer: "border border-sky-500/40 bg-sky-500/15 text-sky-300 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
