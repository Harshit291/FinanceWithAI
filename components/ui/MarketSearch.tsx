"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import type { Market, SymbolResult } from "@/lib/data/symbol-search";

interface MarketSearchProps {
  /** visual size variant */
  size?: "hero" | "compact";
  /** pre-select a market */
  defaultMarket?: Market;
}

const MARKET_CONFIG: Record<Market, { flag: string; label: string; placeholder: string }> = {
  ALL: { flag: "🌍", label: "Global Markets", placeholder: "Search global stocks… e.g. AAPL, RELIANCE" },
  US:  { flag: "🇺🇸", label: "US (NYSE/NASDAQ)", placeholder: "Search US stocks… e.g. AAPL, MSFT" },
  IN:  { flag: "🇮🇳", label: "India (NSE/BSE)", placeholder: "Search Indian stocks… e.g. RELIANCE, TCS" },
  GB:  { flag: "🇬🇧", label: "UK (LSE)", placeholder: "Search UK stocks… e.g. HSBA.L" },
  CA:  { flag: "🇨🇦", label: "Canada (TSX)", placeholder: "Search Canadian stocks… e.g. RY.TO" },
  AU:  { flag: "🇦🇺", label: "Australia (ASX)", placeholder: "Search Australian stocks… e.g. BHP.AX" },
  DE:  { flag: "🇩🇪", label: "Germany (XETRA)", placeholder: "Search German stocks… e.g. SAP.DE" },
  FR:  { flag: "🇫🇷", label: "France (Euronext)", placeholder: "Search French stocks… e.g. MC.PA" },
  JP:  { flag: "🇯🇵", label: "Japan (JPX)", placeholder: "Search Japanese stocks… e.g. 7203.T" },
};

export function MarketSearch({ size = "hero", defaultMarket = "ALL" }: MarketSearchProps) {
  const router = useRouter();
  const [market, setMarket] = useState<Market>(defaultMarket);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cfg = MARKET_CONFIG[market];

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchResults = useCallback((q: string, mkt: Market) => {
    if (q.trim().length < 1) { setResults([]); setOpen(false); return; }
    setLoading(true);
    fetch(`/api/symbols?q=${encodeURIComponent(q)}&market=${mkt}`)
      .then((r) => r.json())
      .then((data: { results: SymbolResult[] }) => {
        setResults(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
        setActiveIdx(-1);
      })
      .catch(() => { setResults([]); setOpen(false); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query, market), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, market, fetchResults]);

  // ── outside click ──────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const switchMarket = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = e.target.value as Market;
    setMarket(m);
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    if (query) fetchResults(query, m);
    inputRef.current?.focus();
  };

  function navigate(symbol: string) {
    setQuery(""); setOpen(false);
    router.push(`/stocks/${encodeURIComponent(symbol)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && results[activeIdx]) { e.preventDefault(); navigate(results[activeIdx].symbol); }
      else if (query.trim()) navigate(query.trim().toUpperCase());
    } else if (e.key === "Escape") setOpen(false);
  }

  const isHero = size === "hero";

  return (
    <div ref={containerRef} className="relative w-full">
      {isHero ? (
        <>
          {/* ── Hero: Stacked Dropdown ── */}
          <div className="relative w-max mb-3">
            <select
              value={market}
              onChange={switchMarket}
              className="appearance-none cursor-pointer pl-3.5 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-lg outline-none text-sm font-mono font-semibold text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-150"
            >
              {(Object.entries(MARKET_CONFIG) as [Market, typeof MARKET_CONFIG[Market]][]).map(([m, c]) => (
                <option key={m} value={m} className="bg-slate-900 text-slate-200">
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* ── Hero: Search input ── */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all duration-150">
            {loading
              ? <div className="shrink-0 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin h-5 w-5" />
              : <Search className="shrink-0 text-slate-500 h-5 w-5" />
            }
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder={cfg.placeholder}
              aria-label="Search for a stock symbol"
              aria-autocomplete="list"
              aria-expanded={open}
              className="flex-1 bg-transparent font-mono text-slate-100 placeholder:text-slate-500 outline-none min-w-0 text-base"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors text-sm font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </>
      ) : (
        /* ── Compact: Unified Inline Bar ── */
        <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-xl focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all duration-150 overflow-hidden">
          <div className="relative shrink-0 border-r border-slate-700/60 bg-slate-900/50 hover:bg-slate-800 transition-colors">
            <select
              value={market}
              onChange={switchMarket}
              className="appearance-none cursor-pointer bg-transparent pl-3 pr-7 py-2.5 text-[11px] uppercase tracking-wider font-mono font-bold text-slate-300 outline-none w-full"
            >
              {(Object.entries(MARKET_CONFIG) as [Market, typeof MARKET_CONFIG[Market]][]).map(([m, c]) => (
                <option key={m} value={m} className="bg-slate-900 text-slate-200 normal-case tracking-normal">
                  {c.flag} {m === "ALL" ? "GLOBAL" : m}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-transparent">
            {loading
              ? <div className="shrink-0 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin h-3.5 w-3.5" />
              : <Search className="shrink-0 text-slate-500 h-3.5 w-3.5" />
            }
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Search stocks..."
              aria-label="Search for a stock symbol"
              aria-autocomplete="list"
              aria-expanded={open}
              className="flex-1 bg-transparent font-mono text-slate-100 placeholder:text-slate-500 outline-none min-w-0 text-xs"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Dropdown Results ── */}
      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-700/80
                     bg-slate-900 shadow-2xl shadow-black/70 z-50 overflow-hidden"
        >
          <li className="px-4 py-2 border-b border-slate-800/60">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              {MARKET_CONFIG[market].flag} {market === "ALL" ? "Global" : MARKET_CONFIG[market].label.split(" ")[0]} Results
            </span>
          </li>
          {results.map((r, i) => (
            <li
              key={r.symbol}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); navigate(r.symbol); }}
              className={`
                flex items-center justify-between px-4 py-3 cursor-pointer
                border-b border-slate-800/40 last:border-0 transition-colors duration-100
                ${i === activeIdx ? "bg-slate-800" : "hover:bg-slate-800/50"}
              `}
            >
              <span className="flex flex-col min-w-0 gap-0.5">
                <span className="text-sm font-mono font-bold text-cyan-400 truncate">{r.symbol}</span>
                <span className="text-xs font-mono text-slate-400 truncate">{r.name}</span>
              </span>
              <span className="ml-4 shrink-0 rounded-md px-2 py-0.5 text-xs font-mono font-semibold
                               bg-slate-800 text-slate-400 border border-slate-700">
                {r.exchange || (r.currency === "INR" ? "NSE" : r.currency || "EQ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
