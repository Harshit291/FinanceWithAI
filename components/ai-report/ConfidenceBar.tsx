import * as Progress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  value: number;
}

function confidenceColor(v: number) {
  if (v >= 70) return "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]";
  if (v >= 45) return "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]";
  return "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]";
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Confidence</span>
        <span className="font-semibold tabular-nums text-slate-300">{value}%</span>
      </div>
      <Progress.Root
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
        value={value}
        aria-label={`Confidence ${value}%`}
      >
        <Progress.Indicator
          className={cn("h-full transition-all rounded-full", confidenceColor(value))}
          style={{ width: `${value}%` }}
        />
      </Progress.Root>
    </div>
  );
}
