"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  symbol: string;
  isAuthenticated: boolean;
}

export function RefreshButton({ symbol, isAuthenticated }: RefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null; // refresh requires auth (otherwise no persistence)

  function refresh() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, force_refresh: true }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Refresh failed");
          return;
        }
        router.refresh();
      } catch {
        setError("Network error");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={refresh}
        disabled={isPending}
        title="Force a new AI synthesis (bypasses cache, persists new row)"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition disabled:opacity-50",
          "border-slate-800 bg-slate-900/60 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30",
        )}
      >
        <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
        {isPending ? "Refreshing" : "Refresh"}
      </button>
      {error && <p className="text-[9px] font-mono text-red-400">{error}</p>}
    </div>
  );
}
