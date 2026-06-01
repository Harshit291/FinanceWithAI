import { ExternalLink } from "lucide-react";
import type { DataSource } from "@/lib/ai/schema";

interface SourceListProps {
  sources: DataSource[];
}

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) return null;
  return (
    <div className="space-y-2">
      {/* Bumped from text-xs → text-xs with better colour */}
      <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
        Sources
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {sources.map((s) => (
          <li key={s.url} className="flex items-center gap-1.5">
            <ExternalLink className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-slate-500 hover:text-slate-200 transition-colors underline underline-offset-2"
            >
              {s.name}
            </a>
            <span className="text-xs font-mono text-slate-700">
              {new Date(s.fetched_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
