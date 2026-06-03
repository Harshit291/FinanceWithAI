"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TradeWidget({ symbol, currentPrice }: { symbol: string, currentPrice?: number }) {
  const [quantity, setQuantity] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleTrade = async (action: "BUY" | "SELL") => {
    if (!quantity || quantity <= 0) {
      setMessage({ text: "Please enter a valid quantity", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/paper-trading/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, action, quantity: Number(quantity) })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Trade failed");
      }

      setMessage({ text: `Successfully ${action === "BUY" ? "bought" : "sold"} ${quantity} shares of ${symbol}`, type: "success" });
      setQuantity("");
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-bold text-slate-200">Paper Trade</h3>
        {currentPrice && (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
            {currentPrice.toFixed(2)} Credits
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Quantity"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          disabled={loading}
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => handleTrade("BUY")}
            disabled={loading}
            className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 rounded-lg py-2 text-sm font-bold font-mono transition-colors disabled:opacity-50"
          >
            BUY
          </button>
          <button
            onClick={() => handleTrade("SELL")}
            disabled={loading}
            className="flex-1 bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 rounded-lg py-2 text-sm font-bold font-mono transition-colors disabled:opacity-50"
          >
            SELL
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-xs font-mono mt-1 ${message.type === "error" ? "text-rose-400" : "text-emerald-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
