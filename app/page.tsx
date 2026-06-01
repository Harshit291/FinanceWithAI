import Link from "next/link";
import { Suspense } from "react";
import { FinAILogo } from "@/components/ui/FinAILogo";
import { MarketSearch } from "@/components/ui/MarketSearch";
import { ArrowUpRight, BarChart2, Brain, Globe } from "lucide-react";

const TICKERS = [
  { s: "RELIANCE.NS", v: "+1.4%" }, { s: "TCS.NS", v: "+0.8%" },
  { s: "HDFCBANK.NS", v: "-0.3%" }, { s: "INFY.NS", v: "+2.1%" },
  { s: "AAPL",        v: "+0.6%" }, { s: "MSFT",   v: "+1.2%" },
  { s: "GOOGL",       v: "-0.4%" }, { s: "TSLA",   v: "+3.7%" },
  { s: "WIPRO.NS",    v: "+0.9%" }, { s: "TATAMOTORS.NS", v: "-1.2%" },
  { s: "NVDA",        v: "+4.3%" }, { s: "BAJFINANCE.NS", v: "+0.5%" },
];

const FEATURES = [
  {
    icon: BarChart2,
    num: "01",
    title: "Professional Charts",
    desc: "Interactive candlestick charts with 25+ technical strategy overlays — SMA, EMA, Bollinger Bands, MACD, RSI, Supertrend and more.",
  },
  {
    icon: Brain,
    num: "02",
    title: "AI Fundamental Analysis",
    desc: "AI synthesises fundamentals, earnings & news into evidence-based verdicts with confidence scores across Short, Medium & Long term horizons.",
  },
  {
    icon: Globe,
    num: "03",
    title: "Indian & US Markets",
    desc: "NSE, BSE, NYSE and NASDAQ in one platform. Select your market, search any equity, and get AI research in seconds.",
  },
];

export default function HomePage() {
  const allTickers = [...TICKERS, ...TICKERS];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Subtle dot grid background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
      {/* Radial glow at hero center */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-[600px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.07),transparent_70%)]" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-800/50">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center px-4 sm:px-6 lg:px-8">
          <FinAILogo />
        </div>
      </nav>

      {/* Ticker tape */}
      <div className="relative z-10 border-b border-slate-800/50 overflow-hidden bg-slate-950/80 py-3">
        <div className="flex animate-ticker gap-12 whitespace-nowrap">
          {allTickers.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-sm font-mono">
              <span className="text-slate-400">{t.s}</span>
              <span className={t.v.startsWith("+") ? "text-emerald-400" : "text-red-400"}>
                {t.v}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-14">

          {/* Left: headline + search */}
          <div className="max-w-2xl flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10
                           px-4 py-1.5 text-sm font-mono font-semibold text-cyan-400 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AI-Powered Stock Research
            </p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
              <span className="block text-slate-100">Research-grade</span>
              <span className="block text-slate-100">analysis for</span>
              <span className="block bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
                serious investors.
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              Professional charts paired with AI fundamental analysis — Short, Medium &amp; Long‑term
              outlooks with confidence scores, delivered in seconds.
            </p>

            {/* Market-filtered search — the main CTA */}
            <div className="max-w-lg">
              <Suspense fallback={<div className="h-32 rounded-2xl bg-slate-900/60 animate-pulse" />}>
                <MarketSearch size="hero" defaultMarket="IN" />
              </Suspense>
            </div>

            {/* Quick-access examples */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-mono text-slate-600">Try:</span>
              {[
                { label: "RELIANCE.NS", href: "/stocks/RELIANCE.NS" },
                { label: "TCS.NS",      href: "/stocks/TCS.NS" },
                { label: "AAPL",        href: "/stocks/AAPL" },
                { label: "NVDA",        href: "/stocks/NVDA" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="group inline-flex items-center gap-1 rounded-lg border border-slate-700/80
                             px-3 py-1.5 text-sm font-mono text-slate-400
                             hover:border-slate-600 hover:text-slate-200 transition-all duration-150"
                >
                  {label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>

            {/* Exchange badges */}
            <div className="mt-8 flex items-center gap-6">
              {["NSE", "BSE", "NYSE", "NASDAQ"].map((m) => (
                <span key={m} className="text-sm font-mono text-slate-700 uppercase tracking-widest">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Right: stats card */}
          <div className="lg:w-72 shrink-0 lg:mt-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 overflow-hidden">
              {[
                { label: "Time horizons",   value: "3",      sub: "Short · Medium · Long" },
                { label: "Analysis time",   value: "<5s",    sub: "Per stock, real-time" },
                { label: "Markets covered", value: "4",      sub: "India + US equities" },
                { label: "Strategies",      value: "25+",    sub: "Technical analysis lenses" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-mono text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-mono text-slate-700 mt-0.5">{sub}</p>
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="relative z-10 border-t border-slate-800/50">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-800/50 rounded-2xl overflow-hidden">
            {FEATURES.map(({ icon: Icon, num, title, desc }) => (
              <div key={num} className="bg-slate-950 px-8 py-8 group hover:bg-slate-900/60 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all">
                    <Icon className="h-4.5 w-4.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-xs font-mono text-slate-700 tracking-widest">{num}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-200 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-800/50 py-6">
        <p className="text-center text-sm font-mono text-slate-700">
          Not investment advice · Educational research only · Consult a SEBI/SEC-registered advisor
        </p>
      </footer>
    </div>
  );
}
