/** Canonical §6 verdict schema. Zod used for runtime validation of every LLM response. */
import { z } from "zod";

export type Stance = "bullish" | "neutral" | "bearish" | "insufficient_data";

export interface DataSource {
  name: string;
  url: string;
  fetched_at: string; // ISO-8601
}

export interface Horizon {
  window: string;
  stance: Stance;
  /** null when stance === "insufficient_data" */
  expected_return_pct_range: [number, number] | null;
  /** 0-100 */
  confidence_pct: number;
  key_drivers: string[];
  key_risks: string[];
}

export interface VerdictReport {
  report_id: string;
  symbol: string;
  as_of: string; // ISO-8601
  model: string;
  data_sources: DataSource[];
  horizons: {
    short_term: Horizon;
    medium_term: Horizon;
    long_term: Horizon;
  };
  /** max 120 words */
  summary_paragraph: string;
  disclaimer: string;
}

export const DISCLAIMER =
  "Not investment advice. Educational research only. Past performance is not indicative of future results. Consult a SEBI/SEC-registered advisor before investing.";

// --- Zod runtime schemas (mirror the TS types above) ---

const DataSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  fetched_at: z.string(),
});

const HorizonSchema = z.object({
  window: z.string(),
  stance: z.enum(["bullish", "neutral", "bearish", "insufficient_data"]),
  expected_return_pct_range: z.tuple([z.number(), z.number()]).nullable(),
  confidence_pct: z.number().min(0).max(100),
  key_drivers: z.array(z.string()),
  key_risks: z.array(z.string()),
});

export const VerdictReportSchema = z.object({
  report_id: z.string(),
  symbol: z.string(),
  as_of: z.string(),
  model: z.string(),
  data_sources: z.array(DataSourceSchema),
  horizons: z.object({
    short_term: HorizonSchema,
    medium_term: HorizonSchema,
    long_term: HorizonSchema,
  }),
  summary_paragraph: z.string(),
  disclaimer: z.string(),
});
