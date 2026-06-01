/**
 * Exchange-aware symbol dispatcher.
 * Uses Yahoo Finance search as primary (free, no key, covers US + India correctly).
 * Supports market filtering: "ALL", "US", "IN", "GB", "DE", etc.
 * Falls back to hardcoded sample list if Yahoo search fails.
 */
import { searchYahooSymbols } from "./yahoo";

export type Market = "ALL" | "US" | "IN" | "GB" | "CA" | "AU" | "DE" | "FR" | "JP";

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
}

/** Hardcoded fallback used when Yahoo search is unavailable. */
const SAMPLE_SYMBOLS: SymbolResult[] = [
  // Indian
  { symbol: "RELIANCE.NS",    name: "Reliance Industries Ltd",          exchange: "NSE", currency: "INR" },
  { symbol: "TCS.NS",         name: "Tata Consultancy Services",        exchange: "NSE", currency: "INR" },
  { symbol: "HDFCBANK.NS",    name: "HDFC Bank Ltd",                    exchange: "NSE", currency: "INR" },
  { symbol: "INFY.NS",        name: "Infosys Ltd",                      exchange: "NSE", currency: "INR" },
  // US
  { symbol: "AAPL",  name: "Apple Inc.",                 exchange: "NASDAQ", currency: "USD" },
  { symbol: "MSFT",  name: "Microsoft Corporation",      exchange: "NASDAQ", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet Inc.",               exchange: "NASDAQ", currency: "USD" },
  { symbol: "NVDA",  name: "NVIDIA Corporation",          exchange: "NASDAQ", currency: "USD" },
  // UK
  { symbol: "HSBA.L", name: "HSBC Holdings plc", exchange: "LSE", currency: "GBP" },
  { symbol: "BP.L", name: "BP p.l.c.", exchange: "LSE", currency: "GBP" },
  // EU
  { symbol: "SAP.DE", name: "SAP SE", exchange: "XETRA", currency: "EUR" },
  { symbol: "MC.PA", name: "LVMH Moët Hennessy", exchange: "Euronext", currency: "EUR" },
  // AU/JP
  { symbol: "BHP.AX", name: "BHP Group", exchange: "ASX", currency: "AUD" },
  { symbol: "7203.T", name: "Toyota Motor Corp", exchange: "JPX", currency: "JPY" },
];

/** Filter helper: keeps only results matching the requested market by looking at symbol suffixes. */
function filterByMarket(results: SymbolResult[], market: Market): SymbolResult[] {
  if (market === "ALL") return results;
  
  return results.filter((r) => {
    switch (market) {
      case "US": return !r.symbol.includes("."); // US equities generally don't have suffixes in Yahoo
      case "IN": return r.symbol.endsWith(".NS") || r.symbol.endsWith(".BO");
      case "GB": return r.symbol.endsWith(".L") || r.symbol.endsWith(".IL");
      case "CA": return r.symbol.endsWith(".TO") || r.symbol.endsWith(".V") || r.symbol.endsWith(".CN");
      case "AU": return r.symbol.endsWith(".AX");
      case "DE": return r.symbol.endsWith(".DE") || r.symbol.endsWith(".F") || r.symbol.endsWith(".MU");
      case "FR": return r.symbol.endsWith(".PA");
      case "JP": return r.symbol.endsWith(".T");
      default: return true;
    }
  });
}

/**
 * Search symbols, optionally scoped to a market.
 * @param query  - user search text
 * @param market - global market filter
 */
export async function searchSymbols(
  query: string,
  market: Market = "ALL"
): Promise<SymbolResult[]> {
  try {
    const raw = await searchYahooSymbols(query);
    const filtered = filterByMarket(raw, market);
    if (filtered.length > 0) return filtered.slice(0, 8);
  } catch {
    // fall through to sample list
  }

  const q = query.toLowerCase();
  return filterByMarket(
    SAMPLE_SYMBOLS.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ),
    market
  ).slice(0, 8);
}
