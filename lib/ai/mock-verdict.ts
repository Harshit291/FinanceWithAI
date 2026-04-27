/** Static mock §6 verdict used throughout session 1 before real LLM integration. */
import type { VerdictReport } from "./schema";
import { DISCLAIMER } from "./schema";

export const MOCK_VERDICT: VerdictReport = {
  report_id: "mock-00000000-0000-0000-0000-000000000000",
  symbol: "RELIANCE.NS",
  as_of: "2026-04-27T00:00:00.000Z",
  model: "mock-session-1",
  data_sources: [
    {
      name: "Sample Data (mock)",
      url: "https://example.com",
      fetched_at: "2026-04-27T00:00:00.000Z",
    },
  ],
  horizons: {
    short_term: {
      window: "1-4 weeks",
      stance: "neutral",
      expected_return_pct_range: [-3, 5],
      confidence_pct: 52,
      key_drivers: ["Q4 results beat estimates by 4%", "Jio subscriber growth steady"],
      key_risks: ["Global crude price spike could compress margin", "Broader market sell-off risk"],
    },
    medium_term: {
      window: "1-6 months",
      stance: "bullish",
      expected_return_pct_range: [5, 18],
      confidence_pct: 68,
      key_drivers: [
        "Retail segment expansion accelerating",
        "New Energy investments expected to unlock valuation re-rating",
      ],
      key_risks: ["Regulatory risk in telecom pricing", "FII outflows from EM equities"],
    },
    long_term: {
      window: "1-3 years",
      stance: "bullish",
      expected_return_pct_range: [20, 60],
      confidence_pct: 74,
      key_drivers: [
        "Green energy transition: 100 GW target provides multi-year earnings visibility",
        "Retail and digital ecosystem compounding at 15%+ CAGR",
      ],
      key_risks: [
        "Execution risk on green energy capex",
        "Conglomerate discount may persist if segments not demerged",
      ],
    },
  },
  summary_paragraph:
    "Reliance Industries presents a mixed near-term picture with steady Jio and Retail contributions offset by refining margin pressure. Over the medium term, continued subscriber addition and retail store expansion support a cautiously bullish stance. The long-term thesis rests on the New Energy pivot — a credible but capital-intensive bet on India's energy transition. Confidence is moderate pending clearer execution signals on the green gigafactory timeline.",
  disclaimer: DISCLAIMER,
};
