import { prisma } from "@/lib/prisma";
import { checkQuota } from "@/lib/reports/quota";
import { QuotaMeter } from "@/components/ai-report/QuotaMeter";
import { RefreshButton } from "@/components/ai-report/RefreshButton";
import { WatchlistToggle } from "@/components/watchlist/WatchlistToggle";

interface HeaderActionsProps {
  symbol: string;
  userId: string | null;
  isAuthenticated: boolean;
}

export async function HeaderActions({ symbol, userId, isAuthenticated }: HeaderActionsProps) {
  const [quota, savedItem] = await Promise.all([
    userId ? checkQuota(userId) : Promise.resolve(null),
    userId
      ? prisma.watchlistItem.findUnique({
          where: { userId_symbol: { userId, symbol } },
          select: { symbol: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {quota && <QuotaMeter used={quota.used} limit={quota.limit} />}
      <RefreshButton symbol={symbol} isAuthenticated={isAuthenticated} />
      <WatchlistToggle
        symbol={symbol}
        initialIsSaved={!!savedItem}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
