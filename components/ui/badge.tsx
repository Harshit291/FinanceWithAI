import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        bullish: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        bearish: "border-red-500/30 bg-red-500/10 text-red-400",
        neutral: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        insufficient_data: "border-slate-700 bg-slate-800/50 text-slate-500",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
