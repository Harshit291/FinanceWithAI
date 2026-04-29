"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistToggleProps {
  symbol: string;
  initialIsSaved: boolean;
  isAuthenticated: boolean;
}

export function WatchlistToggle({ symbol, initialIsSaved, isAuthenticated }: WatchlistToggleProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
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
        const res = next
          ? await fetch("/api/watchlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ symbol }),
            })
          : await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
              method: "DELETE",
            });
        if (!res.ok && res.status !== 409) {
          const data = await res.json().catch(() => ({}));
          setIsSaved(!next); // rollback
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
