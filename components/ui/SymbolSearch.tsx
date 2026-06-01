"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "INR" | "USD";
}

export function SymbolSearch() {
  const router = useRouter();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SymbolResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    fetch(`/api/symbols?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: { results: SymbolResult[] }) => {
        setResults(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
        setActiveIdx(-1);
      })
      .catch(() => { setResults([]); setOpen(false); });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function navigate(symbol: string) {
    setQuery("");
    setOpen(false);
    router.push(`/stocks/${encodeURIComponent(symbol)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      navigate(results[activeIdx].symbol);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg
                      px-3 py-1.5 focus-within:border-cyan-500/50 focus-within:ring-1
                      focus-within:ring-cyan-500/20 transition-all duration-150">
        <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search stocks… (AAPL, RELIANCE.NS)"
          aria-label="Search for a stock symbol"
          aria-autocomplete="list"
          aria-expanded={open}
          className="flex-1 bg-transparent text-[12px] font-mono text-slate-200
                     placeholder:text-slate-600 outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 text-xs"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-slate-700/80
                     bg-slate-900 shadow-2xl shadow-black/60 z-50 overflow-hidden"
        >
          {results.map((r, i) => (
            <li
              key={r.symbol}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); navigate(r.symbol); }}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer
                border-b border-slate-800/60 last:border-0 transition-colors duration-100
                ${i === activeIdx ? "bg-slate-800" : "hover:bg-slate-800/50"}`}
            >
              <span className="flex flex-col min-w-0 gap-0.5">
                <span className="text-[12px] font-mono font-semibold text-cyan-400 truncate">
                  {r.symbol}
                </span>
                <span className="text-[10px] font-mono text-slate-500 truncate">{r.name}</span>
              </span>
              <span className="ml-4 shrink-0 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold
                               bg-slate-800 text-slate-400 border border-slate-700">
                {r.exchange || (r.currency === "INR" ? "NSE" : "US")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
