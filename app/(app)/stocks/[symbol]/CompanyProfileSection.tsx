import { Building2, Info, Activity, PieChart, Coins } from "lucide-react";
import { fetchFundamentals } from "@/lib/data/fundamentals";

interface Props {
  symbol: string;
}

export async function CompanyProfileSection({ symbol }: Props) {
  const data = await fetchFundamentals(symbol);
  if (!data || !data.metrics) return null;

  const m = data.metrics;

  const MetricItem = ({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon: any }) => (
    <div className="flex flex-col p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
      <div className="flex items-center gap-2 mb-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-200">
        {value === null || value === undefined ? "—" : value}
      </div>
    </div>
  );

  return (
    <section aria-label="Company Profile" className="mt-8 space-y-4 animate-fade-in-up">
      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
        <p className="text-sm font-mono font-bold uppercase tracking-widest text-slate-500 shrink-0">
          Company Profile
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-slate-800 to-transparent" />
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/[0.02] blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              <Building2 className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-1">Business Summary</h2>
              <div className="flex gap-2 items-center flex-wrap">
                {m.sector && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800">
                    {m.sector}
                  </span>
                )}
                {m.industry && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800">
                    {m.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {m.longBusinessSummary && (
            <p className="text-sm leading-relaxed text-slate-400 mb-6">
              {m.longBusinessSummary.substring(0, 400)}
              {m.longBusinessSummary.length > 400 && "..."}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricItem label="P/E Ratio" value={m.peRatio} icon={Activity} />
            <MetricItem label="EPS" value={m.epsTrailing} icon={Coins} />
            <MetricItem label="Market Cap" value={formatLargeNumber(m.marketCap)} icon={PieChart} />
            <MetricItem label="52W High" value={m.fiftyTwoWeekHigh} icon={Info} />
          </div>
        </div>
      </div>
    </section>
  );
}

function formatLargeNumber(num: number | undefined | null) {
  if (num === undefined || num === null) return "—";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toLocaleString();
}
