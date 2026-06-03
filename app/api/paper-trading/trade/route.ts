import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import YahooFinance from "yahoo-finance2";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { symbol, action, quantity } = body;

    if (!symbol || !action || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    // Fetch real-time price
    let quote: any = null;
    try {
      const yf: any = new YahooFinance();
      quote = await yf.quote(symbol);
    } catch (e) {
      // ignore
    }
    
    if (!quote || !quote.regularMarketPrice) {
      return NextResponse.json({ error: "Could not fetch current market price" }, { status: 400 });
    }
    const currentPrice = quote.regularMarketPrice;
    const totalValue = currentPrice * quantity;

    // Use a Prisma transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get or create PaperAccount
      let account = await tx.paperAccount.findUnique({ where: { userId } });
      if (!account) {
        account = await tx.paperAccount.create({ data: { userId } });
      }

      if (action === "BUY") {
        if (account.cashBalance < totalValue) {
          throw new Error("Insufficient cash balance");
        }
        
        // Deduct cash
        await tx.paperAccount.update({
          where: { userId },
          data: { cashBalance: { decrement: totalValue } }
        });

        // Update or create position
        const existingPosition = await tx.paperPosition.findUnique({
          where: { userId_symbol: { userId, symbol } }
        });

        if (existingPosition) {
          const newQuantity = existingPosition.quantity + quantity;
          const newAvgPrice = ((existingPosition.quantity * existingPosition.averagePrice) + totalValue) / newQuantity;
          await tx.paperPosition.update({
            where: { userId_symbol: { userId, symbol } },
            data: { quantity: newQuantity, averagePrice: newAvgPrice }
          });
        } else {
          await tx.paperPosition.create({
            data: { userId, symbol, quantity, averagePrice: currentPrice }
          });
        }

        // Record trade
        await tx.paperTrade.create({
          data: { userId, symbol, side: "BUY", quantity, executionPrice: currentPrice }
        });

      } else if (action === "SELL") {
        const existingPosition = await tx.paperPosition.findUnique({
          where: { userId_symbol: { userId, symbol } }
        });

        if (!existingPosition || existingPosition.quantity < quantity) {
          throw new Error("Insufficient position quantity");
        }

        const realizedPnl = (currentPrice - existingPosition.averagePrice) * quantity;

        // Add cash
        await tx.paperAccount.update({
          where: { userId },
          data: { 
            cashBalance: { increment: totalValue },
            totalRealizedPnl: { increment: realizedPnl }
          }
        });

        // Update or delete position
        const newQuantity = existingPosition.quantity - quantity;
        if (newQuantity === 0) {
          await tx.paperPosition.delete({
            where: { userId_symbol: { userId, symbol } }
          });
        } else {
          await tx.paperPosition.update({
            where: { userId_symbol: { userId, symbol } },
            data: { quantity: newQuantity }
          });
        }

        // Record trade
        await tx.paperTrade.create({
          data: { userId, symbol, side: "SELL", quantity, executionPrice: currentPrice, realizedPnl }
        });
      } else {
        throw new Error("Invalid action");
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
