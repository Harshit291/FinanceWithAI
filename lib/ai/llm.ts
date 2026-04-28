/**
 * LLM adapter — delegates to the FastAPI pipeline service which handles
 * data fetching (Finnhub / IndianAPI) + LLM classify + synthesize.
 */
import type { VerdictReport } from "./schema";
import { VerdictReportSchema } from "./schema";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function synthesiseVerdict(symbol: string): Promise<VerdictReport> {
  const res = await fetch(`${FASTAPI_URL}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FastAPI pipeline error ${res.status}: ${text}`);
  }

  const data: unknown = await res.json();
  return VerdictReportSchema.parse(data);
}
