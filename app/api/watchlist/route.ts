import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const MAX_ITEMS = 50;

function exchangeFromSymbol(symbol: string): string {
  if (symbol.endsWith(".NS")) return "NSE";
  if (symbol.endsWith(".BO")) return "BSE";
  return "US";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
    select: { symbol: true, exchange: true, addedAt: true },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  if (!symbol || symbol.length > 20) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const count = await prisma.watchlistItem.count({ where: { userId: session.user.id } });
  if (count >= MAX_ITEMS) {
    return NextResponse.json(
      { error: `Watchlist full (max ${MAX_ITEMS} symbols)` },
      { status: 400 },
    );
  }

  const exchange = String(body.exchange ?? exchangeFromSymbol(symbol));

  try {
    const item = await prisma.watchlistItem.create({
      data: { userId: session.user.id, symbol, exchange },
      select: { symbol: true, exchange: true, addedAt: true },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Already in watchlist" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "symbol query param required" }, { status: 400 });
  }

  const result = await prisma.watchlistItem.deleteMany({
    where: { userId: session.user.id, symbol },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not in watchlist" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
