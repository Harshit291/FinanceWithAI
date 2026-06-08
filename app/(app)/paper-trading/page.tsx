import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import YahooFinance from "yahoo-finance2";
import Link from "next/link";
import { ArrowRight, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { AdSenseUnit } from "@/components/ui/AdSenseUnit";

export const metadata = {
  title: "Paper Trading Portfolio | FinAI",
};

export default async function PaperTradingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  let account = await prisma.paperAccount.findUnique({ where: { userId } });
  if (!account) {
    account = await prisma.paperAccount.create({ data: { userId } });
  }

  const positions = await prisma.paperPosition.findMany({
    where: { userId },
    orderBy: { symbol: 'asc' }
  });

  let totalUnrealizedPnl = 0;
  let totalMarketValue = 0;

  const enrichedPositions = await Promise.all(positions.map(async (pos) => {
    let currentPrice = pos.averagePrice;
    try {
      const yf: any = new YahooFinance();
      const quote = await yf.quote(pos.symbol);
      if (quote && quote.regularMarketPrice) currentPrice = quote.regularMarketPrice;
    } catch (e) {
      // ignore
    }

    const marketValue = currentPrice * pos.quantity;
    const costBasis = pos.averagePrice * pos.quantity;
    const unrealizedPnl = marketValue - costBasis;
    const pnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    totalUnrealizedPnl += unrealizedPnl;
    totalMarketValue += marketValue;

    return { ...pos, currentPrice, marketValue, unrealizedPnl, pnlPercent };
  }));

  const totalPortfolioValue = account.cashBalance + totalMarketValue;
  const totalPnl = account.totalRealizedPnl + totalUnrealizedPnl;
  const isPnlPositive = totalPnl >= 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 max-w-screen-xl mx-auto flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono text-white mb-2">Paper Trading Portfolio</h1>
        <p className="text-slate-400 font-mono text-sm">Simulate trades across global markets in real-time.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest">Net Liq Value</h2>
          </div>
          <p className="text-3xl font-mono text-white">{totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-slate-500">Credits</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest">Cash Balance</h2>
          </div>
          <p className="text-3xl font-mono text-white">{account.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-slate-500">Credits</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest">Total PNL</h2>
          </div>
          <p className={`text-3xl font-mono ${isPnlPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPnlPositive ? "+" : ""}{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col mb-8">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-mono font-bold text-white">Open Positions</h2>
        </div>
        
        {enrichedPositions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-slate-400 font-mono mb-4">You have no open positions.</p>
            <Link href="/" className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded-lg hover:bg-cyan-600/30 transition-colors font-mono text-sm inline-flex items-center gap-2">
              Explore Stocks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm whitespace-nowrap">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Symbol</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right">Qty</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right">Avg Price</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right">Last Price</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right">Market Value</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right">Unrealized PNL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {enrichedPositions.map(pos => {
                  const pnlPos = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.symbol} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/stocks/${pos.symbol}`} className="font-bold text-cyan-400 hover:underline">
                          {pos.symbol}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-300">{pos.quantity}</td>
                      <td className="px-5 py-4 text-right text-slate-300">{pos.averagePrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right text-white">{pos.currentPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right text-slate-300">{pos.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-5 py-4 text-right font-bold ${pnlPos ? "text-emerald-400" : "text-rose-400"}`}>
                        {pnlPos ? "+" : ""}{pos.unrealizedPnl.toFixed(2)} ({pnlPos ? "+" : ""}{pos.pnlPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google AdSense Placement */}
      <div className="w-full mt-auto mb-6 p-4 border border-slate-800 bg-slate-900/30 rounded-xl min-h-[120px]">
        <div className="flex items-center justify-between mb-2 opacity-50">
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Advertisement</p>
        </div>
        <AdSenseUnit client="ca-pub-6476201805386001" slot="3630481177" />
      </div>
    </main>
  );
}
