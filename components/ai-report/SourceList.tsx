import { ExternalLink } from "lucide-react";
import type { DataSource } from "@/lib/ai/schema";

interface SourceListProps {
  sources: DataSource[];
}

/** Links out to each data source — satisfies §6 UI contract. */
export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Sources</p>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.url} className="flex items-center gap-1 text-xs text-zinc-600">
            <ExternalLink className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              {s.name}
            </a>
            <span className="text-zinc-400">
              · {new Date(s.fetched_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
