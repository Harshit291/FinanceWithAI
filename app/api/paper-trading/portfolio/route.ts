import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import YahooFinance from "yahoo-finance2";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Fetch live prices for all open positions to calculate unrealized PNL
    let totalUnrealizedPnl = 0;
    let totalMarketValue = 0;

    const positionsWithLivePnl = await Promise.all(positions.map(async (pos) => {
      let currentPrice = pos.averagePrice;
      try {
        const yf: any = new YahooFinance();
        const quote = await yf.quote(pos.symbol);
        if (quote && quote.regularMarketPrice) {
          currentPrice = quote.regularMarketPrice;
        }
      } catch (e) {
        // Fallback to average price if fetch fails
      }

      const marketValue = currentPrice * pos.quantity;
      const costBasis = pos.averagePrice * pos.quantity;
      const unrealizedPnl = marketValue - costBasis;
      const unrealizedPnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

      totalUnrealizedPnl += unrealizedPnl;
      totalMarketValue += marketValue;

      return {
        ...pos,
        currentPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPercent
      };
    }));

    const totalPortfolioValue = account.cashBalance + totalMarketValue;
    const totalPnl = account.totalRealizedPnl + totalUnrealizedPnl;

    return NextResponse.json({
      account: {
        ...account,
        totalPortfolioValue,
        totalPnl,
        totalUnrealizedPnl
      },
      positions: positionsWithLivePnl
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
