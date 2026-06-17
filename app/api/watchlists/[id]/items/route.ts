import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const MAX_ITEMS = 50;

function exchangeFromSymbol(symbol: string): string {
  if (symbol.endsWith(".NS")) return "NSE";
  if (symbol.endsWith(".BO")) return "BSE";
  return "US";
}

// POST /api/watchlists/[id]/items — add a stock to a watchlist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: watchlistId } = await params;

  // Verify this watchlist belongs to the user
  const watchlist = await prisma.watchlist.findFirst({
    where: { id: watchlistId, userId: session.user.id },
  });
  if (!watchlist)
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  if (!symbol || symbol.length > 20)
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });

  const count = await prisma.watchlistItem.count({ where: { watchlistId } });
  if (count >= MAX_ITEMS)
    return NextResponse.json({ error: `Watchlist full (max ${MAX_ITEMS})` }, { status: 400 });

  const exchange = String(body.exchange ?? exchangeFromSymbol(symbol));

  try {
    const item = await prisma.watchlistItem.create({
      data: { userId: session.user.id, symbol, exchange, watchlistId },
      select: { id: true, symbol: true, exchange: true, addedAt: true },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002")
      return NextResponse.json({ error: "Already in this watchlist" }, { status: 409 });
    throw err;
  }
}

// DELETE /api/watchlists/[id]/items?symbol=AAPL — remove a stock from a watchlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: watchlistId } = await params;
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!symbol)
    return NextResponse.json({ error: "symbol query param required" }, { status: 400 });

  // Verify this watchlist belongs to the user
  const watchlist = await prisma.watchlist.findFirst({
    where: { id: watchlistId, userId: session.user.id },
  });
  if (!watchlist)
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });

  const result = await prisma.watchlistItem.deleteMany({
    where: { watchlistId, symbol },
  });
  if (result.count === 0)
    return NextResponse.json({ error: "Not in watchlist" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
