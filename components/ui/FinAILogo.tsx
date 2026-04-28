import Link from "next/link";

export function FinAILogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 select-none group">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-200">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Candlestick bars — white on blue */}
          <rect x="2" y="9" width="3" height="6" rx="0.75" fill="white" />
          <rect x="3.25" y="7" width="0.75" height="2" fill="white" />
          <rect x="3.25" y="15" width="0.75" height="1.5" fill="white" opacity="0.6" />

          <rect x="7.5" y="4" width="3" height="8" rx="0.75" fill="white" />
          <rect x="8.75" y="2" width="0.75" height="2" fill="white" />
          <rect x="8.75" y="12" width="0.75" height="1.5" fill="white" opacity="0.6" />

          <rect x="13" y="6" width="3" height="7" rx="0.75" fill="white" />
          <rect x="14.25" y="4" width="0.75" height="2" fill="white" />
          <rect x="14.25" y="13" width="0.75" height="1.5" fill="white" opacity="0.6" />
        </svg>
      </div>
      <span className="text-base font-bold tracking-tight text-slate-100">
        Fin<span className="text-blue-400">AI</span>
      </span>
    </Link>
  );
}
