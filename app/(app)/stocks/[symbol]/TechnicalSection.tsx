import { Suspense } from "react";
import { synthesiseTechnical } from "@/lib/ai/technical";
import { TechnicalPanel } from "@/components/charts/TechnicalPanel";
import { StrategySelector } from "@/components/ui/StrategySelector";

function StrategySelectorFallback() {
  return (
    <div className="h-9 mb-4 rounded-lg bg-slate-800/60 animate-pulse" />
  );
}

export async function TechnicalSection({ symbol, strategy }: { symbol: string; strategy: string }) {
  let technical = null;
  try {
    technical = await synthesiseTechnical(symbol, strategy);
  } catch (err) {
    console.error("[TechnicalSection] FastAPI unreachable:", err);
  }
  if (!technical) return null;
  return (
    <div className="flex flex-col">
      {/* Suspense required — StrategySelector calls useSearchParams() */}
      <Suspense fallback={<StrategySelectorFallback />}>
        <StrategySelector currentStrategy={strategy} />
      </Suspense>
      <TechnicalPanel verdict={technical} strategy={strategy} />
    </div>
  );
}
