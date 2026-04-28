/**
 * LLM adapter — all AI calls go through here.
 * Currently backed by Groq (OpenAI-compatible API).
 * Swap to Anthropic: set GROQ_API_KEY → ANTHROPIC_API_KEY and update baseURL + models in .env.local.
 */
import OpenAI from "openai";
import { z } from "zod";
import type { VerdictReport } from "./schema";
import { VerdictReportSchema } from "./schema";

const SYNTHESIS_MODEL = process.env.LLM_SYNTHESIS_MODEL ?? "llama-3.3-70b-versatile";
export const CLASSIFIER_MODEL = process.env.LLM_CLASSIFIER_MODEL ?? "llama-3.1-8b-instant";

function groqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

const SYNTH_SYSTEM = `You are a neutral, analytical equity research assistant. Synthesize a structured, evidence-based report for a single listed stock from the data provided.

Rules:
1. USE ONLY DATA PROVIDED. Never invent prices, ratios, EPS, returns, or headlines. If data is absent, use stance="insufficient_data" and null for numeric ranges.
2. NO BIAS. Reach conclusions only when data supports them. Mixed or thin evidence → stance="neutral" or "insufficient_data".
3. SHOW REASONING in key_drivers and key_risks with specific data points.
4. CONFIDENCE: 50 = weak/balanced signal, 80+ = multiple converging strong signals.
5. HORIZONS: short_term (1-4 wks) leans on news/recent results; medium_term (1-6 mo) on earnings/valuation; long_term (1-3 yr) on moat/balance sheet.
6. summary_paragraph: plain English, max 120 words.
7. disclaimer MUST BE EXACTLY: "Not investment advice. Educational research only. Past performance is not indicative of future results. Consult a SEBI/SEC-registered advisor before investing."
8. OUTPUT: a single JSON object matching this schema — no prose, no markdown fences:

{
  "report_id": "string",
  "symbol": "string",
  "as_of": "ISO-8601",
  "model": "string",
  "data_sources": [{"name":"string","url":"string","fetched_at":"ISO-8601"}],
  "horizons": {
    "short_term":  {"window":"string","stance":"bullish|neutral|bearish|insufficient_data","expected_return_pct_range":[number,number]|null,"confidence_pct":0-100,"key_drivers":["string"],"key_risks":["string"]},
    "medium_term": {"window":"string","stance":"bullish|neutral|bearish|insufficient_data","expected_return_pct_range":[number,number]|null,"confidence_pct":0-100,"key_drivers":["string"],"key_risks":["string"]},
    "long_term":   {"window":"string","stance":"bullish|neutral|bearish|insufficient_data","expected_return_pct_range":[number,number]|null,"confidence_pct":0-100,"key_drivers":["string"],"key_risks":["string"]}
  },
  "summary_paragraph": "string",
  "disclaimer": "string"
}`;

async function callSynthesis(userMessage: string): Promise<VerdictReport> {
  const client = groqClient();
  const completion = await client.chat.completions.create({
    model: SYNTHESIS_MODEL,
    messages: [
      { role: "system", content: SYNTH_SYSTEM },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  return VerdictReportSchema.parse(JSON.parse(raw));
}

export async function synthesiseVerdict(symbol: string): Promise<VerdictReport> {
  const reportId = crypto.randomUUID();
  const now = new Date().toISOString();
  const exchange = symbol.endsWith(".NS") ? "NSE" : symbol.endsWith(".BO") ? "BSE" : "NYSE/NASDAQ";
  const currency = symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD";

  const userMessage = `SYMBOL: ${symbol}
AS_OF: ${now}
EXCHANGE: ${exchange}
CURRENCY: ${currency}
REPORT_ID: ${reportId}

COMPANY SNAPSHOT: unavailable — data pipeline not yet connected
LAST 4 QUARTERS RESULTS: unavailable
PEERS: unavailable
NEWS (last 90 days): unavailable

Since no fundamental or market data is provided, set all horizon stances to "insufficient_data" and expected_return_pct_range to null. Produce the VerdictReport now.`;

  try {
    const report = await callSynthesis(userMessage);
    return { ...report, report_id: reportId, symbol, as_of: now, model: SYNTHESIS_MODEL };
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError) {
      // Retry once on schema / parse failure
      const report = await callSynthesis(userMessage);
      return { ...report, report_id: reportId, symbol, as_of: now, model: SYNTHESIS_MODEL };
    }
    throw e;
  }
}
