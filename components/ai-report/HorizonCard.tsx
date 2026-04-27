import { TrendingDown, TrendingUp, Minus, HelpCircle } from "lucide-react";
import type { Horizon, Stance } from "@/lib/ai/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBar } from "./ConfidenceBar";
import { cn } from "@/lib/utils";

interface HorizonCardProps {
  label: string; // "Short term", "Medium term", "Long term"
  horizon: Horizon;
}

const STANCE_ICON: Record<Stance, React.ReactNode> = {
  bullish: <TrendingUp className="h-4 w-4" aria-hidden />,
  bearish: <TrendingDown className="h-4 w-4" aria-hidden />,
  neutral: <Minus className="h-4 w-4" aria-hidden />,
  insufficient_data: <HelpCircle className="h-4 w-4" aria-hidden />,
};

const STANCE_LABEL: Record<Stance, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
  insufficient_data: "Insufficient data",
};

/** Single horizon card satisfying the §6 UI contract. */
export function HorizonCard({ label, horizon }: HorizonCardProps) {
  const isInsufficient = horizon.stance === "insufficient_data";

  return (
    <Card className={cn(isInsufficient && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm text-zinc-600">{label}</CardTitle>
          <Badge variant={horizon.stance}>
            <span className="flex items-center gap-1">
              {STANCE_ICON[horizon.stance]}
              {STANCE_LABEL[horizon.stance]}
            </span>
          </Badge>
        </div>
        <p className="text-xs text-zinc-400">{horizon.window}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Return range */}
        <div className="text-center">
          {horizon.expected_return_pct_range ? (
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                horizon.stance === "bullish" ? "text-emerald-600" : "text-red-600"
              )}
            >
              {horizon.expected_return_pct_range[0] > 0 ? "+" : ""}
              {horizon.expected_return_pct_range[0]}% &rarr; {horizon.expected_return_pct_range[1] > 0 ? "+" : ""}
              {horizon.expected_return_pct_range[1]}%
            </p>
          ) : (
            <p className="text-sm text-zinc-400">Return range unavailable</p>
          )}
          <p className="text-xs text-zinc-400">expected return range</p>
        </div>

        <ConfidenceBar value={horizon.confidence_pct} />

        {/* Drivers */}
        {horizon.key_drivers.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
              Key drivers
            </p>
            <ul className="space-y-0.5">
              {horizon.key_drivers.map((d, i) => (
                <li key={i} className="flex items-start gap-1 text-xs text-zinc-600">
                  <span className="mt-0.5 text-emerald-500" aria-hidden>+</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {horizon.key_risks.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-600">
              Key risks
            </p>
            <ul className="space-y-0.5">
              {horizon.key_risks.map((r, i) => (
                <li key={i} className="flex items-start gap-1 text-xs text-zinc-600">
                  <span className="mt-0.5 text-red-400" aria-hidden>−</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
