"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-slate-500" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition font-mono"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-slate-500" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition font-mono"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 px-4 py-2.5 text-sm font-mono font-semibold text-slate-950 transition-colors"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="relative mt-6 mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700/80"></div>
        </div>
        <div className="relative flex justify-center text-xs font-mono">
          <span className="bg-slate-900/80 px-2 text-slate-500 uppercase tracking-widest">or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 px-4 py-2.5 text-sm font-mono font-semibold text-slate-200 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}
