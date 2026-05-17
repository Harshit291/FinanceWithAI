import { synthesiseTechnical } from "@/lib/ai/technical";
import { TechnicalPanel } from "@/components/charts/TechnicalPanel";

export async function TechnicalSection({ symbol }: { symbol: string }) {
  const technical = await synthesiseTechnical(symbol).catch(() => null);
  if (!technical) return null;
  return <TechnicalPanel verdict={technical} />;
}
