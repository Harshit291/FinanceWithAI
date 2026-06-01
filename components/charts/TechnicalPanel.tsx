import type { TechnicalVerdict, TechnicalSignal, Action } from "@/lib/ai/schema";
import { ConfidenceBar } from "@/components/ai-report/ConfidenceBar";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, HelpCircle, ArrowUp, ArrowDown, BookOpen } from "lucide-react";

// ── Action config ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  Action,
  { label: string; badge: string; value: string; bg: string; border: string; glow: string; icon: React.ReactNode }
> = {
  buy: {
    label: "BUY",
    badge: "text-emerald-300 bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    value: "text-emerald-400",
    bg: "bg-gradient-to-br from-emerald-500/5 to-transparent",
    border: "border-l-emerald-500/60",
    glow: "shadow-[0_4px_24px_rgba(16,185,129,0.06)]",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  hold: {
    label: "HOLD",
    badge: "text-amber-300 bg-amber-500/15 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    value: "text-amber-400",
    bg: "bg-gradient-to-br from-amber-500/5 to-transparent",
    border: "border-l-amber-500/60",
    glow: "shadow-[0_4px_24px_rgba(245,158,11,0.06)]",
    icon: <Minus className="h-4 w-4" />,
  },
  sell: {
    label: "SELL",
    badge: "text-red-300 bg-red-500/15 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]",
    value: "text-red-400",
    bg: "bg-gradient-to-br from-red-500/5 to-transparent",
    border: "border-l-red-500/60",
    glow: "shadow-[0_4px_24px_rgba(239,68,68,0.06)]",
    icon: <TrendingDown className="h-4 w-4" />,
  },
  insufficient_data: {
    label: "N/A",
    badge: "text-slate-500 bg-slate-800 border-slate-700",
    value: "text-slate-600",
    bg: "",
    border: "border-l-slate-700",
    glow: "",
    icon: <HelpCircle className="h-4 w-4" />,
  },
};

// ── Strategy guide definitions ─────────────────────────────────────────────────

const STRATEGY_GUIDE: Record<
  string,
  { name: string; description: string; indicators: { name: string; what: string }[] }
> = {
  trend_following: {
    name: "SMA Trend (20/50/200)",
    description: "Identifies the dominant price trend using three moving average periods. Price above all three averages signals a strong uptrend.",
    indicators: [
      { name: "SMA-20", what: "Short-term trend direction over ~1 month" },
      { name: "SMA-50", what: "Medium-term momentum over ~2.5 months" },
      { name: "SMA-200", what: "Long-term trend health — the 'golden' benchmark" },
      { name: "MACD", what: "Momentum crossover: bullish above zero line" },
    ],
  },
  ema_crossover: {
    name: "EMA Crossover (9/21/50)",
    description: "Exponential MAs react faster to price changes than simple MAs. A bullish cross is when EMA-9 crosses above EMA-21.",
    indicators: [
      { name: "EMA-9", what: "Very fast-reacting short-term signal" },
      { name: "EMA-21", what: "Short-term trend confirmation" },
      { name: "EMA-50", what: "Medium-term trend filter" },
    ],
  },
  golden_death_cross: {
    name: "Golden / Death Cross",
    description: "One of the most watched long-term signals: a Golden Cross (SMA-50 > SMA-200) is bullish; a Death Cross is bearish.",
    indicators: [
      { name: "SMA-50",  what: "Fast line — crosses above/below SMA-200 to signal regime change" },
      { name: "SMA-200", what: "Slow line — defines the long-term bull/bear regime" },
    ],
  },
  adx_trend: {
    name: "ADX Trend Strength",
    description: "ADX measures trend strength regardless of direction. >25 = strong trend, <20 = ranging market.",
    indicators: [
      { name: "ADX",   what: "Trend strength 0–100; direction-agnostic" },
      { name: "+DI/-DI", what: "Directional indicators show bull vs bear power" },
    ],
  },
  supertrend: {
    name: "Supertrend (ATR-based)",
    description: "A dynamic support/resistance line derived from Average True Range. Flips above/below price to signal trend changes.",
    indicators: [
      { name: "Supertrend line", what: "Green = bullish regime; Red = bearish regime" },
      { name: "ATR",             what: "Measures recent volatility to set the band width" },
    ],
  },
  mean_reversion: {
    name: "RSI + Bollinger Bands",
    description: "Assumes price reverts to its mean. Band touches signal extremes; RSI confirms overbought/oversold conditions.",
    indicators: [
      { name: "Bollinger Upper/Lower", what: "±2 std dev from SMA-20; touching bands = extreme" },
      { name: "RSI-14",               what: ">70 = overbought (sell signal); <30 = oversold (buy signal)" },
      { name: "SMA-20",               what: "Mid-band — the mean price reverts toward" },
    ],
  },
  rsi_divergence: {
    name: "RSI Divergence",
    description: "When price makes new highs but RSI does not (bearish divergence), momentum is weakening — a reversal warning.",
    indicators: [
      { name: "RSI-14",       what: "Momentum oscillator; compare highs/lows with price" },
      { name: "Divergence",   what: "Price vs RSI mismatch signals weakening trend" },
    ],
  },
  stochastic_oscillator: {
    name: "Stochastic %K/%D",
    description: "Compares closing price to the price range over 14 periods. >80 = overbought, <20 = oversold.",
    indicators: [
      { name: "%K (fast line)", what: "Raw stochastic — current close relative to range" },
      { name: "%D (slow line)", what: "3-period MA of %K — smoother signal" },
    ],
  },
  williams_r: {
    name: "Williams %R",
    description: "Identifies overbought/oversold conditions. Range: −100 to 0. Near 0 = overbought; near −100 = oversold.",
    indicators: [
      { name: "Williams %R", what: "Momentum oscillator inverse of Stochastic" },
    ],
  },
  cci: {
    name: "CCI (Commodity Channel Index)",
    description: "Measures deviation from average price. >+100 = strong uptrend; <−100 = strong downtrend.",
    indicators: [
      { name: "CCI-20",  what: "Cyclical indicator — +100/−100 are key thresholds" },
    ],
  },
  momentum: {
    name: "Volume + 52W Breakout + MACD",
    description: "Combines volume surge, 52-week high breakout, and MACD confirmation to identify high-conviction momentum setups.",
    indicators: [
      { name: "Volume surge",    what: "Above-average volume confirms breakout strength" },
      { name: "52W High/Low",   what: "Breakout above 52W high = strong momentum signal" },
      { name: "MACD histogram", what: "Positive and rising = accelerating momentum" },
    ],
  },
  roc: {
    name: "Rate of Change (10/20/60d)",
    description: "Measures percentage price change over a look-back period. Positive and accelerating = strong momentum.",
    indicators: [
      { name: "ROC-10", what: "Short-term momentum (2 weeks)" },
      { name: "ROC-20", what: "Medium-term momentum (1 month)" },
      { name: "ROC-60", what: "Quarterly momentum — trend confirmation" },
    ],
  },
  price_momentum: {
    name: "Price Momentum (1/3/6/12M)",
    description: "Ranks price performance across multiple time frames. Strength across all periods = sustained momentum.",
    indicators: [
      { name: "1M return",  what: "Very short-term price change" },
      { name: "3M return",  what: "Short-term momentum confirmation" },
      { name: "6M return",  what: "Medium-term trend strength" },
      { name: "12M return", what: "Annual performance — long-run momentum" },
    ],
  },
  macd_histogram: {
    name: "MACD Histogram Slope",
    description: "The histogram (MACD minus Signal) shows acceleration. Rising bars = bullish momentum building.",
    indicators: [
      { name: "MACD line",   what: "12-EMA minus 26-EMA" },
      { name: "Signal line", what: "9-EMA of MACD — crossover = signal" },
      { name: "Histogram",   what: "Bar height = strength; direction = acceleration" },
    ],
  },
  tsi: {
    name: "True Strength Index (25,13)",
    description: "Double-smoothed momentum oscillator. Above zero = bullish; crosses above zero after divergence = buy signal.",
    indicators: [
      { name: "TSI",         what: "Smoothed momentum: +25 overbought, −25 oversold" },
      { name: "Signal line", what: "EMA of TSI — crossover triggers" },
    ],
  },
  bollinger_squeeze: {
    name: "Bollinger Squeeze",
    description: "When Bollinger Bands narrow inside Keltner Channels, volatility is compressed — a breakout is imminent.",
    indicators: [
      { name: "Bollinger Bands", what: "±2σ from SMA-20; narrows before breakouts" },
      { name: "Keltner Channel", what: "ATR-based bands; BB inside KC = squeeze active" },
      { name: "Histogram",       what: "Momentum direction predicts breakout side" },
    ],
  },
  atr_breakout: {
    name: "ATR Breakout Channel",
    description: "Price breaking above the ATR-based channel around SMA-20 signals an acceleration move.",
    indicators: [
      { name: "ATR-14",         what: "Average True Range — measures daily volatility" },
      { name: "Upper channel",  what: "SMA-20 + ATR; breakout above = buy signal" },
      { name: "Lower channel",  what: "SMA-20 − ATR; break below = sell signal" },
    ],
  },
  historical_volatility: {
    name: "Historical Volatility",
    description: "Compares realized volatility across time frames. Expanding HV signals increasing risk; compressing HV precedes moves.",
    indicators: [
      { name: "HV-20",  what: "Short-term realized volatility (1 month annualized)" },
      { name: "HV-60",  what: "Medium-term volatility baseline" },
      { name: "HV-252", what: "Annual volatility — long-run risk measure" },
    ],
  },
  donchian_breakout: {
    name: "Donchian Channel (20/55d)",
    description: "Classic trend-following used by the Turtle Traders. Buy on 55-day high, exit on 20-day low.",
    indicators: [
      { name: "Donchian-20", what: "Short-term high/low range — exit signal" },
      { name: "Donchian-55", what: "Longer-term range breakout — entry signal" },
    ],
  },
  volatility_ratio: {
    name: "Volatility Ratio (HV-5/HV-20)",
    description: "Ratio of very short-term to short-term volatility. >1 signals a volatility spike, often at turning points.",
    indicators: [
      { name: "VR = HV-5 / HV-20", what: ">1.5 = unusual spike; often precedes reversal" },
    ],
  },
  "52w_range": {
    name: "52-Week Range Position",
    description: "Where does today's price sit in the 52-week range? Extremes often mean revert; strength near highs = momentum.",
    indicators: [
      { name: "52W High",      what: "Resistance; break above = strong breakout" },
      { name: "52W Low",       what: "Support; break below = capitulation" },
      { name: "Range %ile",    what: "Position within the annual price range" },
    ],
  },
  support_resistance: {
    name: "Pivot Points (S1/R1/S2/R2)",
    description: "Classic floor-trader levels calculated from prior price action. Price reacts predictably at these levels.",
    indicators: [
      { name: "Pivot (P)",    what: "Central equilibrium level" },
      { name: "R1 / R2",     what: "First and second resistance levels" },
      { name: "S1 / S2",     what: "First and second support levels" },
    ],
  },
  fibonacci: {
    name: "Fibonacci Retracement",
    description: "Identifies where a retracement is likely to find support/resistance using the golden ratio.",
    indicators: [
      { name: "38.2% level", what: "Shallow retracement — strong trend continuation" },
      { name: "50.0% level", what: "Mid retracement — contested zone" },
      { name: "61.8% level", what: "Deep retracement — key golden ratio support" },
    ],
  },
  elder_ray: {
    name: "Elder Ray (Bull/Bear Power)",
    description: "Bull Power = high minus EMA-13. Bear Power = low minus EMA-13. Both measure the power of bulls and bears.",
    indicators: [
      { name: "Bull Power", what: "Positive and rising = bulls in control" },
      { name: "Bear Power", what: "Negative and rising toward zero = weakening bears" },
      { name: "EMA-13",     what: "Baseline value for power calculations" },
    ],
  },
  force_index: {
    name: "Force Index (FI-2 / FI-13)",
    description: "Combines price change and volume to measure the force behind moves. Divergences signal reversals.",
    indicators: [
      { name: "FI-2",  what: "Very fast — catches short-term reversals" },
      { name: "FI-13", what: "Slower — confirms intermediate-term momentum" },
    ],
  },
};

function getGuide(strategy: string) {
  return STRATEGY_GUIDE[strategy] ?? {
    name: strategy.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "AI technical analysis based on price and volume data.",
    indicators: [],
  };
}

// ── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({
  label,
  window: timeWindow,
  signal,
}: {
  label: string;
  window: string;
  signal: TechnicalSignal;
}) {
  const c = ACTION_CONFIG[signal.action];
  return (
    <div
      className={cn(
        "relative flex-1 rounded-2xl border border-slate-800/60 border-l-2 p-5 overflow-hidden",
        "transition-all duration-200 hover:border-slate-700/80",
        c.bg, c.border, c.glow,
        signal.action === "insufficient_data" && "opacity-50"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-slate-500">
            {label}
          </p>
          <p className="text-xs font-mono text-slate-600 mt-0.5">{timeWindow}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-mono font-bold",
            c.badge
          )}
        >
          {c.icon}
          {c.label}
        </span>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <ConfidenceBar value={signal.confidence_pct} />
      </div>

      {/* Rationale */}
      {signal.rationale && (
        <p className="text-sm leading-relaxed text-slate-500 mb-4">{signal.rationale}</p>
      )}

      {/* Indicator pills */}
      {signal.indicators.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {signal.indicators.slice(0, 5).map((ind, i) => (
            <span
              key={i}
              className={cn(
                "inline-block rounded-md px-2.5 py-1 text-xs font-mono bg-slate-800/80 border border-slate-700/60",
                c.value
              )}
            >
              {ind}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Strategy guide card ───────────────────────────────────────────────────────

function StrategyGuideCard({ strategy }: { strategy: string }) {
  const guide = getGuide(strategy);
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 border border-slate-700 shrink-0">
          <BookOpen className="h-3 w-3 text-slate-400" />
        </div>
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-600">
            Strategy Guide
          </p>
          <p className="text-sm font-mono font-semibold text-slate-300 mt-0.5">{guide.name}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-slate-500 mb-4">{guide.description}</p>

      {/* Indicator breakdown */}
      {guide.indicators.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-600 mb-2">
            What each indicator means
          </p>
          {guide.indicators.map((ind) => (
            <div key={ind.name} className="flex gap-3 items-start">
              <span className="shrink-0 rounded-md px-2.5 py-1 text-xs font-mono bg-slate-800 border border-slate-700/60 text-cyan-400/80 whitespace-nowrap mt-0.5">
                {ind.name}
              </span>
              <p className="text-sm text-slate-500 leading-snug">{ind.what}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface TechnicalPanelProps {
  verdict: TechnicalVerdict;
  strategy?: string;
}

export function TechnicalPanel({ verdict, strategy = "trend_following" }: TechnicalPanelProps) {
  const hasLevels =
    verdict.key_levels.support !== null || verdict.key_levels.resistance !== null;

  return (
    <div className="mt-4 space-y-4 animate-fade-in-up">

      {/* Section label — enlarged */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
        <p className="text-sm font-mono font-bold uppercase tracking-widest text-slate-500 shrink-0">
          Technical Analysis · AI
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-slate-800 to-transparent" />
      </div>

      {/* Signal cards */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SignalCard label="Short term" window="1–4 weeks" signal={verdict.short_term} />
        <SignalCard label="Long term"  window="1+ year"   signal={verdict.long_term}  />
      </div>

      {/* Key price levels */}
      {hasLevels && (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 px-5 py-4">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-slate-600 mb-3">
            Key Price Levels
          </p>
          <div className="flex items-center gap-8">
            {verdict.key_levels.support !== null && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Support</p>
                  <p className="text-lg font-mono font-bold text-emerald-400 tabular-nums leading-none">
                    {verdict.key_levels.support}
                  </p>
                </div>
              </div>
            )}
            {verdict.key_levels.resistance !== null && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-red-500/10 border border-red-500/20">
                  <ArrowDown className="h-3.5 w-3.5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Resistance</p>
                  <p className="text-lg font-mono font-bold text-red-400 tabular-nums leading-none">
                    {verdict.key_levels.resistance}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strategy guide — fills blank space with educational content */}
      <StrategyGuideCard strategy={strategy} />

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-slate-700 px-1">
        ⚠ Technical signals are based on price history only. Not investment advice.
      </p>
    </div>
  );
}
