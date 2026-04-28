import Link from "next/link";
import { FinAILogo } from "@/components/ui/FinAILogo";
import { ArrowUpRight } from "lucide-react";

const TICKERS = [
  { s: "RELIANCE.NS", v: "+1.4%" }, { s: "TCS.NS", v: "+0.8%" },
  { s: "HDFCBANK.NS", v: "-0.3%" }, { s: "INFY.NS", v: "+2.1%" },
  { s: "AAPL", v: "+0.6%" }, { s: "MSFT", v: "+1.2%" },
  { s: "GOOGL", v: "-0.4%" }, { s: "TSLA", v: "+3.7%" },
  { s: "WIPRO.NS", v: "+0.9%" }, { s: "TATAMOTORS.NS", v: "-1.2%" },
  { s: "NVDA", v: "+4.3%" }, { s: "BAJFINANCE.NS", v: "+0.5%" },
];

export default function HomePage() {
  const allTickers = [...TICKERS, ...TICKERS];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Subtle grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-800/50">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-4 sm:px-6 lg:px-8">
          <FinAILogo />
        </div>
      </nav>

      {/* Ticker tape */}
      <div className="relative z-10 border-b border-slate-800/50 overflow-hidden bg-slate-950/80 py-2.5">
        <div className="flex animate-ticker gap-10 whitespace-nowrap">
          {allTickers.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">{t.s}</span>
              <span
                className={
                  t.v.startsWith("+") ? "text-emerald-400" : "text-red-400"
                }
              >
                {t.v}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero — asymmetric left-aligned */}
      <section className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          {/* Left: headline */}
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-500 mb-6">
              AI-Powered Stock Research
            </p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span className="block text-slate-100">Research-grade</span>
              <span className="block text-slate-100">analysis for</span>
              <span className="block bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
                serious investors.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
              Professional TradingView charts paired with Claude AI fundamental analysis —
              short, medium &amp; long‑term outlooks delivered in seconds.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/stocks/RELIANCE.NS"
                className="group inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-mono font-semibold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all"
              >
                Analyse RELIANCE.NS
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/stocks/AAPL"
                className="group inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-3 text-sm font-mono font-semibold text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all"
              >
                Analyse AAPL
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6">
              {["NSE", "BSE", "NYSE", "NASDAQ"].map((m) => (
                <span key={m} className="text-xs font-mono text-slate-600 uppercase tracking-wider">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Right: stats + feature list */}
          <div className="lg:w-72 shrink-0">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 overflow-hidden">
              {[
                { label: "Time horizons", value: "3", sub: "Short · Medium · Long" },
                { label: "Analysis time", value: "<5s", sub: "Per stock, real-time" },
                { label: "Markets covered", value: "4", sub: "India + US equities" },
                { label: "AI model", value: "Claude", sub: "Anthropic · Groq" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{label}</p>
                    <p className="text-[11px] text-slate-700 mt-0.5">{sub}</p>
                  </div>
                  <span className="text-xl font-bold font-mono text-slate-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="relative z-10 border-t border-slate-800/50">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-800/50 rounded-xl overflow-hidden">
            {[
              {
                num: "01",
                title: "Professional Charts",
                desc: "Full TradingView widget — drawing tools, Fibonacci, 100+ indicators, real-time OHLCV across all timeframes.",
              },
              {
                num: "02",
                title: "AI Fundamental Analysis",
                desc: "Claude AI synthesises fundamentals, earnings & news into evidence-based verdicts with confidence scores.",
              },
              {
                num: "03",
                title: "Indian & US Markets",
                desc: "NSE, BSE, NYSE and NASDAQ in one platform. Search any equity, get AI research instantly.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num} className="bg-slate-950 px-8 py-8 group hover:bg-slate-900/50 transition-colors">
                <span className="text-xs font-mono text-slate-700 tracking-widest">{num}</span>
                <h3 className="mt-3 text-sm font-semibold text-slate-200">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-800/50 py-6">
        <p className="text-center text-xs font-mono text-slate-700">
          Not investment advice · Educational research only · Consult a SEBI/SEC-registered advisor
        </p>
      </footer>
    </div>
  );
}
