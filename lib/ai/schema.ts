/** Canonical §6 verdict schema. Zod used for runtime validation of every Claude response. */

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
