import yahooFinance from 'yahoo-finance2';
import { unstable_cache } from 'next/cache';

export interface FundamentalsData {
  metrics: Record<string, any>;
  earnings: any[];
}

async function _fetchFundamentals(symbol: string): Promise<FundamentalsData | null> {
  try {
    const data = await yahooFinance.quoteSummary(symbol, {
      modules: ['summaryProfile', 'summaryDetail', 'price', 'defaultKeyStatistics']
    }) as any;

    const profile = data.summaryProfile || {};
    const detail = data.summaryDetail || {};
    const price = data.price || {};
    const stats = data.defaultKeyStatistics || {};

    const metrics = {
      peRatio: detail.trailingPE || detail.forwardPE,
      forwardPE: detail.forwardPE,
      priceToBook: detail.priceToBook,
      priceToSales: detail.priceToSalesTrailing12Months,
      evToEbitda: stats.enterpriseToEbitda,
      evToRevenue: stats.enterpriseToRevenue,
      marketCap: price.marketCap || detail.marketCap,
      enterpriseValue: stats.enterpriseValue,
      beta: detail.beta,
      epsTrailing: detail.trailingEps,
      epsForward: detail.forwardEps,
      earningsGrowthYoY: stats.earningsQuarterlyGrowth ? `${(stats.earningsQuarterlyGrowth * 100).toFixed(2)}%` : null,
      grossMargins: detail.grossMargins ? `${(detail.grossMargins * 100).toFixed(2)}%` : null,
      operatingMargins: detail.operatingMargins ? `${(detail.operatingMargins * 100).toFixed(2)}%` : null,
      netMargins: detail.profitMargins ? `${(detail.profitMargins * 100).toFixed(2)}%` : null,
      returnOnEquity: detail.returnOnEquity ? `${(detail.returnOnEquity * 100).toFixed(2)}%` : null,
      returnOnAssets: detail.returnOnAssets ? `${(detail.returnOnAssets * 100).toFixed(2)}%` : null,
      debtToEquity: detail.debtToEquity,
      currentRatio: detail.currentRatio,
      bookValue: detail.bookValue,
      totalRevenue: detail.totalRevenue,
      totalDebt: detail.totalDebt,
      freeCashflow: detail.freeCashflow,
      dividendYield: detail.dividendYield ? `${(detail.dividendYield * 100).toFixed(2)}%` : null,
      payoutRatio: detail.payoutRatio ? `${(detail.payoutRatio * 100).toFixed(2)}%` : null,
      fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: detail.fiftyTwoWeekLow,
      sector: profile.sector,
      industry: profile.industry,
      fullTimeEmployees: profile.fullTimeEmployees,
      longBusinessSummary: profile.longBusinessSummary ? profile.longBusinessSummary.substring(0, 500) : null,
    };

    const cleanedMetrics = Object.fromEntries(
      Object.entries(metrics).filter(([_, v]) => v != null)
    );

    return { metrics: cleanedMetrics, earnings: [] };
  } catch (error) {
    console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
    return null;
  }
}

// Wrap with Next.js cache so we only hit Yahoo once every 6 hours per stock
export const fetchFundamentals = unstable_cache(
  async (symbol: string) => _fetchFundamentals(symbol),
  ['fundamentals-cache'],
  { revalidate: 21600, tags: ['fundamentals'] }
);
