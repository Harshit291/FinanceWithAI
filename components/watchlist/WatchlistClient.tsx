"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Search, Plus, X, Loader2, Trash2, Edit2, Check,
  BookmarkPlus, MoreHorizontal, Star, ArrowUpRight, TrendingUp, TrendingDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchlistItem {
  id: string;
  symbol: string;
  exchange: string;
  addedAt: string;
}

interface Watchlist {
  id: string;
  name: string;
  createdAt: string;
  items: WatchlistItem[];
}

interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "INR" | "USD";
}

interface QuoteData {
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

type QuoteMap = Record<string, QuoteData>;


// ─── Add Stock Modal ──────────────────────────────────────────────────────────

function AddStockModal({
  watchlistId,
  watchlistName,
  onClose,
  onAdded,
}: {
  watchlistId: string;
  watchlistName: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback((q: string) => {
    if (q.length < 1) { setResults([]); setSearching(false); return; }
    setSearching(true);
    fetch(`/api/symbols?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: { results: SymbolResult[] }) => {
        setResults(data.results ?? []);
        setSearching(false);
      })
      .catch(() => { setResults([]); setSearching(false); });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  async function addSymbol(r: SymbolResult) {
    setAdding(r.symbol);
    setError(null);
    try {
      const res = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: r.symbol,
          exchange: r.exchange || (r.currency === "INR" ? "NSE" : "US"),
        }),
      });
      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to add");
      } else {
        onAdded();
        // Keep modal open so user can add more
        setQuery("");
        setResults([]);
      }
    } catch {
      setError("Network error");
    } finally {
      setAdding(null);
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-mono font-bold text-white">Add Stock</h2>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              to &quot;{watchlistName}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
            {searching
              ? <Loader2 className="h-4 w-4 text-slate-500 shrink-0 animate-spin" />
              : <Search className="h-4 w-4 text-slate-500 shrink-0" />}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks… (AAPL, RELIANCE.NS)"
              className="flex-1 bg-transparent text-sm font-mono text-slate-200 placeholder:text-slate-600 outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); }}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-2 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="px-5 pt-3 pb-5 max-h-72 overflow-y-auto">
          {results.length === 0 && query.length >= 1 && !searching ? (
            <p className="text-sm font-mono text-slate-600 py-6 text-center">
              No results for &quot;{query}&quot;
            </p>
          ) : results.length === 0 ? (
            <p className="text-xs font-mono text-slate-700 py-6 text-center">
              Type a ticker or company name to search globally
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.symbol}>
                  <button
                    onClick={() => addSymbol(r)}
                    disabled={adding === r.symbol}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/40 transition-all group text-left disabled:opacity-60"
                  >
                    <span className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-sm font-mono font-semibold text-cyan-400">{r.symbol}</span>
                      <span className="text-[11px] font-mono text-slate-500 truncate">{r.name}</span>
                    </span>
                    <span className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="rounded-md px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {r.exchange || (r.currency === "INR" ? "NSE" : "US")}
                      </span>
                      {adding === r.symbol
                        ? <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                        : <Plus className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Watchlist Modal ───────────────────────────────────────────────────

function CreateWatchlistModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-32 px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-mono font-bold text-white">New Watchlist</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 block">
              Watchlist Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Tech Stocks, Long Term…"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {error && <p className="text-xs font-mono text-red-400 mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 font-mono text-sm rounded-xl py-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Watchlist
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stock Card ───────────────────────────────────────────────────────────────

function StockCard({
  item,
  watchlistId,
  quote,
  onRemoved,
}: {
  item: WatchlistItem;
  watchlistId: string;
  quote?: QuoteData;
  onRemoved: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  async function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    try {
      await fetch(
        `/api/watchlists/${watchlistId}/items?symbol=${encodeURIComponent(item.symbol)}`,
        { method: "DELETE" }
      );
      onRemoved();
    } catch {
      setRemoving(false);
    }
  }

  const isUp = quote?.change != null && quote.change >= 0;
  const hasQuote = quote?.price != null;

  // Derive currency symbol from exchange
  const currencySymbol = ["NSE", "BSE"].includes(item.exchange)
    ? "₹"
    : ["LSE"].includes(item.exchange)
    ? "£"
    : ["XETRA", "EPA", "AMS"].includes(item.exchange)
    ? "€"
    : "$"; // default US / NASDAQ / NYSE

  return (
    <li className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all">
      <Link href={`/stocks/${encodeURIComponent(item.symbol)}`} className="block">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600">
              {item.exchange} · Equities
            </p>
            <p className="text-lg font-bold font-mono tracking-tight text-slate-100 flex items-center gap-1.5">
              {item.symbol}
              <ArrowUpRight className="h-3 w-3 text-slate-700 group-hover:text-cyan-400 transition" />
            </p>
          </div>
          {/* Live price */}
          <div className="text-right shrink-0">
            {hasQuote ? (
              <>
                <p className="text-base font-mono font-bold text-white">
                  <span className="text-slate-500 font-normal">{currencySymbol}</span>{quote!.price!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] font-mono flex items-center justify-end gap-0.5 ${
                  isUp ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isUp ? "+" : ""}{quote!.changePercent!.toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-xs font-mono text-slate-700">—</p>
            )}
          </div>
        </div>
        <p className="text-[10px] font-mono text-slate-700">
          Added {new Date(item.addedAt).toISOString().slice(0, 10)}
        </p>
      </Link>
      <button
        onClick={remove}
        disabled={removing}
        title={`Remove ${item.symbol}`}
        className="absolute top-3 right-3 rounded-md border border-slate-800 bg-slate-950/80 p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50"
      >
        {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>
    </li>
  );
}

// ─── Active Watchlist Content ─────────────────────────────────────────────────

function WatchlistContent({
  watchlist,
  onDeleted,
  onRenamed,
  onItemsChanged,
}: {
  watchlist: Watchlist;
  onDeleted: () => void;
  onRenamed: (name: string) => void;
  onItemsChanged: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(watchlist.name);
  const [, startTransition] = useTransition();
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Fetch live prices
  const fetchQuotes = useCallback(async () => {
    if (watchlist.items.length === 0) return;
    setQuotesLoading(true);
    try {
      const symbols = watchlist.items.map((i) => i.symbol).join(",");
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes ?? {});
      }
    } finally {
      setQuotesLoading(false);
    }
  }, [watchlist.items]);

  useEffect(() => {
    fetchQuotes();
    // Refresh every 60 seconds
    const interval = setInterval(fetchQuotes, 60_000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Close menu on outside click
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function deleteWatchlist() {
    setMenuOpen(false);
    if (!confirm(`Delete "${watchlist.name}"? This cannot be undone.`)) return;
    await fetch(`/api/watchlists/${watchlist.id}`, { method: "DELETE" });
    onDeleted();
  }

  async function renameWatchlist() {
    if (!newName.trim() || newName === watchlist.name) { setRenaming(false); return; }
    const res = await fetch(`/api/watchlists/${watchlist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      onRenamed(newName.trim());
      setRenaming(false);
    }
  }

  return (
    <div>
      {/* Content header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameWatchlist();
                  if (e.key === "Escape") setRenaming(false);
                }}
                maxLength={40}
                autoFocus
                className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-sm font-mono text-white outline-none focus:border-cyan-500/50"
              />
              <button onClick={renameWatchlist} className="text-cyan-400 hover:text-cyan-300 transition">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => { setRenaming(false); setNewName(watchlist.name); }} className="text-slate-500 hover:text-slate-300 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs font-mono text-slate-500">
              {watchlist.items.length} stock{watchlist.items.length !== 1 ? "s" : ""} saved
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 rounded-lg font-mono text-xs transition"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Add Stock
          </button>
          {/* Live price refresh indicator */}
          <button
            onClick={fetchQuotes}
            disabled={quotesLoading}
            title="Refresh prices"
            className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition disabled:opacity-40"
          >
            <Loader2 className={`h-3.5 w-3.5 ${quotesLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-30 min-w-[160px] py-1 overflow-hidden">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                    setNewName(watchlist.name);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Rename
                </button>
                <div className="h-px bg-slate-800 mx-2" />
                <button
                  onClick={deleteWatchlist}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono text-red-400 hover:bg-red-500/10 transition text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Watchlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock grid */}
      {watchlist.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-14 text-center">
          <BookmarkPlus className="h-9 w-9 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-mono text-slate-500 mb-1">No stocks yet</p>
          <p className="text-xs font-mono text-slate-700 mb-5">
            Search and add stocks from any market globally
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-mono text-cyan-400 hover:bg-cyan-500/15 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add your first stock
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchlist.items.map((item) => (
            <StockCard
              key={item.id}
              item={item}
              watchlistId={watchlist.id}
              quote={quotes[item.symbol]}
              onRemoved={() => startTransition(() => onItemsChanged())}
            />
          ))}
        </ul>
      )}

      {/* Add Stock Modal */}
      {addOpen && (
        <AddStockModal
          watchlistId={watchlist.id}
          watchlistName={watchlist.name}
          onClose={() => setAddOpen(false)}
          onAdded={onItemsChanged}
        />
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function WatchlistClient() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  async function fetchWatchlists(keepActive = true) {
    try {
      const res = await fetch("/api/watchlists");
      if (!res.ok) return;
      const data = await res.json();
      const lists: Watchlist[] = data.watchlists ?? [];
      setWatchlists(lists);
      if (!keepActive || !activeId) {
        setActiveId(lists[0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchWatchlists(false); }, []);

  async function createWatchlist(name: string) {
    const res = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to create watchlist");
    }
    const data = await res.json();
    setWatchlists((prev) => [...prev, data.watchlist]);
    setActiveId(data.watchlist.id);
  }

  function handleDeleted(id: string) {
    setWatchlists((prev) => {
      const remaining = prev.filter((w) => w.id !== id);
      if (activeId === id) setActiveId(remaining[0]?.id ?? null);
      return remaining;
    });
  }

  function handleRenamed(id: string, name: string) {
    setWatchlists((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
  }

  const activeWatchlist = watchlists.find((w) => w.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 text-slate-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600 mb-1">
            {watchlists.length} / 10 Watchlists
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-slate-100">
            Watchlist
          </h1>
        </div>
        {watchlists.length < 10 && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 rounded-xl font-mono text-sm transition"
          >
            <Plus className="h-4 w-4" />
            New Watchlist
          </button>
        )}
      </div>

      {/* Empty state */}
      {watchlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-16 text-center">
          <Star className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-mono mb-2 text-lg">No watchlists yet</p>
          <p className="text-slate-600 font-mono text-sm mb-6">
            Create up to 10 watchlists to organise your stocks
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-mono text-cyan-400 hover:bg-cyan-500/15 transition"
          >
            <Plus className="h-4 w-4" />
            Create your first watchlist
          </button>
        </div>
      ) : (
        <div>
          {/* Tab bar */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {watchlists.map((wl) => (
              <button
                key={wl.id}
                onClick={() => setActiveId(wl.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all ${
                  activeId === wl.id
                    ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Star className={`h-3 w-3 ${activeId === wl.id ? "text-cyan-400" : "text-slate-600"}`} />
                {wl.name}
                <span className={`ml-0.5 text-[10px] ${activeId === wl.id ? "text-cyan-500/60" : "text-slate-700"}`}>
                  {wl.items.length}
                </span>
              </button>
            ))}
          </div>

          {/* Active watchlist content */}
          {activeWatchlist && (
            <WatchlistContent
              key={activeWatchlist.id}
              watchlist={activeWatchlist}
              onDeleted={() => handleDeleted(activeWatchlist.id)}
              onRenamed={(name) => handleRenamed(activeWatchlist.id, name)}
              onItemsChanged={() => fetchWatchlists()}
            />
          )}
        </div>
      )}

      {/* Create Watchlist Modal */}
      {createOpen && (
        <CreateWatchlistModal
          onClose={() => setCreateOpen(false)}
          onCreate={createWatchlist}
        />
      )}
    </>
  );
}
