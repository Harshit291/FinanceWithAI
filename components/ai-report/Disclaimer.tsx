import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/ai/schema";

/** Renders the §6 disclaimer. Always visible, never collapsed. */
export function Disclaimer() {
  return (
    <div
      role="note"
      aria-label="Investment disclaimer"
      className="flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-xs text-amber-500/80"
    >
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/60" aria-hidden />
      <p>{DISCLAIMER}</p>
    </div>
  );
}
