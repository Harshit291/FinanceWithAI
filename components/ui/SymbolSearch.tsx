"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "INR" | "USD";
}

export function SymbolSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    fetch(`/api/symbols?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: { results: SymbolResult[] }) => {
        setResults(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
        setActiveIdx(-1);
      })
      .catch(() => {
        setResults([]);
        setOpen(false);
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
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
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search symbol…"
        aria-label="Search for a stock symbol"
        aria-autocomplete="list"
        aria-expanded={open}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={r.symbol}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                navigate(r.symbol);
              }}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                i === activeIdx ? "bg-zinc-100" : ""
              }`}
            >
              <span>
                <span className="font-medium text-zinc-900">{r.symbol}</span>
                <span className="ml-2 text-zinc-500">{r.name}</span>
              </span>
              <span className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600">
                {r.exchange}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
