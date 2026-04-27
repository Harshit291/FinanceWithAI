import { describe, it, expect } from "vitest";
import { MOCK_VERDICT, } from "./mock-verdict";
import { DISCLAIMER } from "./schema";

describe("mock verdict", () => {
  it("has the exact §6 disclaimer string", () => {
    expect(MOCK_VERDICT.disclaimer).toBe(DISCLAIMER);
  });

  it("references both SEBI and SEC in the disclaimer", () => {
    expect(DISCLAIMER).toMatch(/SEBI/);
    expect(DISCLAIMER).toMatch(/SEC/);
  });

  it("each horizon has at least one driver and one risk", () => {
    for (const key of ["short_term", "medium_term", "long_term"] as const) {
      const h = MOCK_VERDICT.horizons[key];
      expect(h.key_drivers.length).toBeGreaterThanOrEqual(1);
      expect(h.key_risks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("confidence_pct is between 0 and 100 for all horizons", () => {
    for (const key of ["short_term", "medium_term", "long_term"] as const) {
      const { confidence_pct } = MOCK_VERDICT.horizons[key];
      expect(confidence_pct).toBeGreaterThanOrEqual(0);
      expect(confidence_pct).toBeLessThanOrEqual(100);
    }
  });
});
