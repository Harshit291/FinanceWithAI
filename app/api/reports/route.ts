import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { synthesiseVerdict, synthesiseVerdictFresh } from "@/lib/ai/llm";
import { persistAiReport } from "@/lib/reports/persist";
import { checkQuota } from "@/lib/reports/quota";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

/** GET /api/reports               — list current user's reports (paginated)
 *  GET /api/reports?symbol=AAPL    — list reports for a single symbol
 *  GET /api/reports?limit=N&offset=M — paginate */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbolParam = req.nextUrl.searchParams.get("symbol");
  const symbol = symbolParam?.trim().toUpperCase();
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const offset = Math.max(Number(req.nextUrl.searchParams.get("offset")) || 0, 0);

  const where = symbol ? { userId: session.user.id, symbol } : { userId: session.user.id };
  const [items, total] = await Promise.all([
    prisma.aiReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: { id: true, symbol: true, reportId: true, reportJson: true, createdAt: true },
    }),
    prisma.aiReport.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      reportId: r.reportId,
      report: JSON.parse(r.reportJson),
      createdAt: r.createdAt,
    })),
    total,
    limit,
    offset,
  });
}

/** POST /api/reports
 *  Body: { symbol: string, force_refresh?: boolean }
 *  Generates a verdict (cached unless force_refresh=true). Persists to DB if
 *  the user is authenticated and the verdict is not a graceful-degradation. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    symbol?: string;
    force_refresh?: boolean;
  };
  const symbol = body.symbol?.trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json(
      { error: "symbol is required", code: "MISSING_SYMBOL" },
      { status: 400 },
    );
  }

  const session = await auth();

  // Authenticated users gated by daily quota. Anonymous users get the
  // shared cache; no per-user quota since they don't persist rows.
  if (session?.user?.id) {
    const quota = await checkQuota(session.user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Daily report quota reached",
          code: "QUOTA_EXCEEDED",
          used: quota.used,
          limit: quota.limit,
          resetsAt: quota.resetsAt.toISOString(),
        },
        { status: 429 },
      );
    }
  }

  const report = body.force_refresh
    ? await synthesiseVerdictFresh(symbol)
    : await synthesiseVerdict(symbol);

  if (session?.user?.id) {
    await persistAiReport(session.user.id, symbol, report).catch(() => {
      // Persistence failure must not break the user-facing response.
    });
  }

  return NextResponse.json(report);
}

/** DELETE /api/reports?id=<aiReportId> — remove a saved report (own only). */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  const result = await prisma.aiReport.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
