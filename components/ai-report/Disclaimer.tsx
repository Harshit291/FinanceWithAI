import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/ai/schema";

/** Renders the §6 disclaimer. Always visible, never collapsed. */
export function Disclaimer() {
  return (
    <div
      role="note"
      aria-label="Investment disclaimer"
      className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/70" aria-hidden />
      {/* Bumped from text-xs → text-sm */}
      <p className="text-sm text-amber-500/80 leading-relaxed">{DISCLAIMER}</p>
    </div>
  );
}
