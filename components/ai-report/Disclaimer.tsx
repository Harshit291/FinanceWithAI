import { AlertTriangle } from "lucide-react";
import { DISCLAIMER } from "@/lib/ai/schema";

/** Renders the §6 disclaimer. Always visible, never collapsed. */
export function Disclaimer() {
  return (
    <div
      role="note"
      aria-label="Investment disclaimer"
      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{DISCLAIMER}</p>
    </div>
  );
}
