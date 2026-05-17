/**
 * Convert our internal symbol format to the format TradingView widget expects.
 * e.g. RELIANCE.NS → NSE:RELIANCE, RELIANCE.BO → BSE:RELIANCE, AAPL → NASDAQ:AAPL
 */

const US_NASDAQ_SYMBOLS = new Set([
  "AAPL","MSFT","GOOGL","GOOG","AMZN","NVDA","META","TSLA","AVGO","COST",
  "NFLX","AMD","INTC","QCOM","INTU","AMAT","MU","ADI","LRCX","KLAC",
]);

/** Map a TradingView exchange:ticker pair back to our internal symbol format.
 *  "NSE:RELIANCE" → "RELIANCE.NS", "BSE:TCS" → "TCS.BO", "NASDAQ:NFLX" → "NFLX" */
export function fromTvSymbol(tvSymbol: string): string {
  const upper = tvSymbol.toUpperCase().trim();
  if (upper.startsWith("NSE:")) return upper.slice(4) + ".NS";
  if (upper.startsWith("BSE:")) return upper.slice(4) + ".BO";
  const colon = upper.indexOf(":");
  return colon >= 0 ? upper.slice(colon + 1) : upper;
}

/** Map an internal symbol string to a TradingView exchange:ticker pair. */
export function toTvSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();

  if (upper.endsWith(".NS")) {
    const ticker = upper.replace(/\.NS$/, "");
    return `NSE:${ticker}`;
  }
  if (upper.endsWith(".BO")) {
    const ticker = upper.replace(/\.BO$/, "");
    return `BSE:${ticker}`;
  }
  // US symbols: guess exchange from known NASDAQ list, else NYSE
  const exchange = US_NASDAQ_SYMBOLS.has(upper) ? "NASDAQ" : "NYSE";
  return `${exchange}:${upper}`;
}
