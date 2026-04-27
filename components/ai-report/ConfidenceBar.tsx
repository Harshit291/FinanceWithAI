import * as Progress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  value: number; // 0-100
}

function confidenceColor(v: number) {
  if (v >= 70) return "bg-emerald-500";
  if (v >= 45) return "bg-amber-400";
  return "bg-red-400";
}

/** Renders confidence as both a number and a colored progress bar (§6 UI contract). */
export function ConfidenceBar({ value }: ConfidenceBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Confidence</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <Progress.Root
        className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100"
        value={value}
        aria-label={`Confidence ${value}%`}
      >
        <Progress.Indicator
          className={cn("h-full transition-all", confidenceColor(value))}
          style={{ width: `${value}%` }}
        />
      </Progress.Root>
    </div>
  );
}
