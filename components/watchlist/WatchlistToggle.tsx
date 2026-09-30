"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistToggleProps {
  symbol: string;
  initialIsSaved: boolean;
  initialWatchlistId: string | null;
  isAuthenticated: boolean;
}

interface WatchlistResponse {
  id: string;
  name: string;
}

async function getOrCreateSavedWatchlist(): Promise<WatchlistResponse> {
  const listsResponse = await fetch("/api/watchlists");
  if (!listsResponse.ok) throw new Error("Unable to load watchlists");

  const { watchlists = [] } = await listsResponse.json() as { watchlists: WatchlistResponse[] };
  const existing = watchlists.find((watchlist) => watchlist.name === "Saved Stocks") ?? watchlists[0];
  if (existing) return existing;

  const createResponse = await fetch("/api/watchlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Saved Stocks" }),
  });
  if (createResponse.ok) {
    const { watchlist } = await createResponse.json() as { watchlist: WatchlistResponse };
    return watchlist;
  }

  if (createResponse.status === 409) {
    return getOrCreateSavedWatchlist();
  }
  throw new Error("Unable to create a watchlist");
}

export function WatchlistToggle({
  symbol,
  initialIsSaved,
  initialWatchlistId,
  isAuthenticated,
}: WatchlistToggleProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [watchlistId, setWatchlistId] = useState(initialWatchlistId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push(`/login?callbackUrl=/stocks/${symbol}`)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition"
        title="Sign in to save to watchlist"
      >
        <Bookmark className="h-3 w-3" />
        Save
      </button>
    );
  }

  function toggle() {
    setError(null);
    const next = !isSaved;
    setIsSaved(next); // optimistic

    startTransition(async () => {
      try {
        let res: Response;
        if (next) {
          const targetWatchlist = await getOrCreateSavedWatchlist();
          setWatchlistId(targetWatchlist.id);
          res = await fetch(`/api/watchlists/${targetWatchlist.id}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ symbol }),
            });
        } else if (watchlistId) {
          res = await fetch(`/api/watchlists/${watchlistId}/items?symbol=${encodeURIComponent(symbol)}`, {
            method: "DELETE",
          });
        } else {
          res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
              method: "DELETE",
            });
        }
        if (!res.ok && res.status !== 409) {
          const data = await res.json().catch(() => ({}));
          setIsSaved(!next); // rollback
          if (next) setWatchlistId(null);
          setError(data.error ?? "Failed");
          return;
        }
        router.refresh();
      } catch {
        setIsSaved(!next);
        setError("Network error");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition disabled:opacity-50",
          isSaved
            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
            : "border-slate-800 bg-slate-900/60 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30",
        )}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="h-3 w-3" />
        ) : (
          <Bookmark className="h-3 w-3" />
        )}
        {isSaved ? "Saved" : "Save"}
      </button>
      {error && <p className="text-[9px] font-mono text-red-400">{error}</p>}
    </div>
  );
}
