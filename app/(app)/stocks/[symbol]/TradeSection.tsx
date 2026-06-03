import { fetchFundamentals } from "@/lib/data/fundamentals";
import { TradeWidget } from "@/components/trading/TradeWidget";

export async function TradeSection({ symbol }: { symbol: string }) {
  const data = await fetchFundamentals(symbol);
  const currentPrice = data?.metrics?.marketCap ? data.metrics.priceToBook : undefined; // Wait, fundamentals doesn't directly expose currentPrice easily.

  // Let's just use YahooFinance directly for the live price since fundamentals is cached 6 hours
  // Actually, we can just pass the symbol and let TradeWidget not show currentPrice initially,
  // or fetch it.
  
  // Let's do a quick fetch
  const YahooFinance = (await import("yahoo-finance2")).default;
  let price;
  try {
    const yf: any = new YahooFinance();
    const quote = await yf.quote(symbol);
    price = quote.regularMarketPrice;
  } catch (e) {
    // ignore
  }

  return <TradeWidget symbol={symbol} currentPrice={price} />;
}
