"use client";

import { useState } from "react";
import { Heart, X, QrCode, Loader2 } from "lucide-react";

export function SupportUsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors focus:outline-none"
      >
        <Heart className="h-4 w-4" />
        Support Us
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-mono font-bold text-slate-200 flex items-center gap-2">
                <Heart className="h-4 w-4 text-emerald-500" />
                Support Our Servers
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-48 h-48 bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-700 p-2 relative overflow-hidden">
                {/* Placeholder for actual QR code */}
                <QrCode className="h-24 w-24 text-slate-600 mb-2" />
                <p className="text-xs font-mono text-slate-500">Scan to Donate</p>
                
                {/* Fake scanning beam animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent h-full w-full -translate-y-full animate-[scan_2s_ease-in-out_infinite]" />
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                We are indie developers running these heavy AI models entirely for free. Your support helps us keep the servers awake and fast!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
