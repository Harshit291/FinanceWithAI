"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

interface ReportRowDeleteButtonProps {
  id: string;
}

export function ReportRowDeleteButton({ id }: ReportRowDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed");
          return;
        }
        router.refresh();
      } catch {
        setError("Network error");
      }
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      title={error ?? "Delete report"}
      aria-label={error ?? "Delete report"}
      className="absolute top-3 right-3 rounded-md border border-slate-800 bg-slate-950/80 p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
    </button>
  );
}
