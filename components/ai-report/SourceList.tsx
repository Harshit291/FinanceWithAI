import { ExternalLink } from "lucide-react";
import type { DataSource } from "@/lib/ai/schema";

interface SourceListProps {
  sources: DataSource[];
}

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Sources</p>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.url} className="flex items-center gap-1.5 text-xs">
            <ExternalLink className="h-3 w-3 shrink-0 text-slate-700" aria-hidden />
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              {s.name}
            </a>
            <span className="text-slate-700">
              · {new Date(s.fetched_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
