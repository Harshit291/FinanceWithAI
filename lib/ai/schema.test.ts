import { describe, it, expect } from "vitest";
import { DISCLAIMER, VerdictReportSchema } from "./schema";

describe("VerdictReport schema", () => {
  it("DISCLAIMER references both SEBI and SEC", () => {
    expect(DISCLAIMER).toMatch(/SEBI/);
    expect(DISCLAIMER).toMatch(/SEC/);
  });

  it("DISCLAIMER is a non-empty string", () => {
    expect(typeof DISCLAIMER).toBe("string");
    expect(DISCLAIMER.length).toBeGreaterThan(20);
  });

  it("VerdictReportSchema rejects missing fields", () => {
    expect(() =>
      VerdictReportSchema.parse({ symbol: "TEST" }),
    ).toThrow();
  });

  it("VerdictReportSchema validates a correct minimal report", () => {
    const validReport = {
      report_id: "test-id",
      symbol: "AAPL",
      as_of: "2026-01-01T00:00:00Z",
      model: "test-model",
      data_sources: [],
      horizons: {
        short_term: {
          window: "1-4 weeks",
          stance: "neutral",
          expected_return_pct_range: null,
          confidence_pct: 50,
          key_drivers: ["test driver"],
          key_risks: ["test risk"],
        },
        medium_term: {
          window: "1-6 months",
          stance: "bullish",
          expected_return_pct_range: [5, 20],
          confidence_pct: 65,
          key_drivers: ["driver"],
          key_risks: ["risk"],
        },
        long_term: {
          window: "1-3 years",
          stance: "bearish",
          expected_return_pct_range: null,
          confidence_pct: 40,
          key_drivers: [],
          key_risks: ["risk"],
        },
      },
      summary_paragraph: "Test summary.",
      disclaimer: DISCLAIMER,
    };
    expect(() => VerdictReportSchema.parse(validReport)).not.toThrow();
  });
});
