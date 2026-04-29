import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { FinAILogo } from "@/components/ui/FinAILogo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <FinAILogo />
          <div className="flex items-center gap-5">
            {isAuthenticated ? (
              <>
                <Link
                  href="/watchlist"
                  className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-400 transition"
                >
                  Watchlist
                </Link>
                <Link
                  href="/reports"
                  className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-400 transition"
                >
                  Reports
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-400 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
