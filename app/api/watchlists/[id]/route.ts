import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

// DELETE /api/watchlists/[id] — delete a watchlist
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await prisma.watchlist.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

// PATCH /api/watchlists/[id] — rename a watchlist
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name || name.length > 40)
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  try {
    const watchlist = await prisma.watchlist.updateMany({
      where: { id, userId: session.user.id },
      data: { name },
    });
    if (watchlist.count === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002")
      return NextResponse.json({ error: "Name already used" }, { status: 409 });
    throw err;
  }
}
