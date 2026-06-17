import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const MAX_WATCHLISTS = 10;

// GET /api/watchlists — list all watchlists for user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        select: { id: true, symbol: true, exchange: true, addedAt: true },
      },
    },
  });
  return NextResponse.json({ watchlists });
}

// POST /api/watchlists — create a new watchlist
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name || name.length > 40)
    return NextResponse.json({ error: "Invalid name (max 40 chars)" }, { status: 400 });

  const count = await prisma.watchlist.count({ where: { userId: session.user.id } });
  if (count >= MAX_WATCHLISTS)
    return NextResponse.json({ error: `Max ${MAX_WATCHLISTS} watchlists allowed` }, { status: 400 });

  try {
    const watchlist = await prisma.watchlist.create({
      data: { userId: session.user.id, name },
      include: { items: true },
    });
    return NextResponse.json({ watchlist }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002")
      return NextResponse.json({ error: "A watchlist with that name already exists" }, { status: 409 });
    throw err;
  }
}
