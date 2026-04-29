import type { TechnicalVerdict } from "./schema";
import { TechnicalVerdictSchema } from "./schema";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function synthesiseTechnical(symbol: string): Promise<TechnicalVerdict> {
  const res = await fetch(`${FASTAPI_URL}/technical-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FastAPI technical-analysis error ${res.status}: ${text}`);
  }

  const data: unknown = await res.json();
  return TechnicalVerdictSchema.parse(data);
}
