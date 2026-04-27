import { describe, it, expect } from "vitest";
import { toTvSymbol } from "./tv-symbol";

describe("toTvSymbol", () => {
  it("maps .NS symbols to NSE: prefix", () => {
    expect(toTvSymbol("RELIANCE.NS")).toBe("NSE:RELIANCE");
    expect(toTvSymbol("INFY.NS")).toBe("NSE:INFY");
  });

  it("maps .BO symbols to BSE: prefix", () => {
    expect(toTvSymbol("RELIANCE.BO")).toBe("BSE:RELIANCE");
  });

  it("maps known NASDAQ symbols correctly", () => {
    expect(toTvSymbol("AAPL")).toBe("NASDAQ:AAPL");
    expect(toTvSymbol("MSFT")).toBe("NASDAQ:MSFT");
  });

  it("defaults unknown US symbols to NYSE", () => {
    expect(toTvSymbol("JPM")).toBe("NYSE:JPM");
  });

  it("is case-insensitive", () => {
    expect(toTvSymbol("reliance.ns")).toBe("NSE:RELIANCE");
    expect(toTvSymbol("aapl")).toBe("NASDAQ:AAPL");
  });
});
