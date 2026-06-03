import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { FinAILogo } from "@/components/ui/FinAILogo";
import Image from "next/image";
import { LogOut } from "lucide-react";

export async function Navbar() {
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;
  const user = session?.user;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <FinAILogo />
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <Link
                href="/watchlist"
                className="text-sm font-mono text-slate-400 hover:text-cyan-400 transition-colors duration-150"
              >
                Watchlist
              </Link>
              <Link
                href="/reports"
                className="text-sm font-mono text-slate-400 hover:text-cyan-400 transition-colors duration-150"
              >
                Reports
              </Link>
              <Link
                href="/paper-trading"
                className="text-sm font-mono text-emerald-400/80 hover:text-emerald-400 transition-colors duration-150"
              >
                Portfolio
              </Link>
              {/* User avatar + name */}
              <div className="flex items-center gap-2.5 border-l border-slate-800 pl-5">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={28}
                    height={28}
                    className="rounded-full ring-1 ring-slate-700"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-1 ring-slate-700">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <span className="text-sm font-mono text-slate-300 hidden sm:block">
                  {user?.name?.split(" ")[0] ?? "User"}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    title="Sign out"
                    className="text-slate-500 hover:text-rose-400 transition-colors duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-mono text-slate-400 hover:text-cyan-400 transition-colors duration-150"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
