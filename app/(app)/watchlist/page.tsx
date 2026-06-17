import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { WatchlistClient } from "@/components/watchlist/WatchlistClient";

export const metadata: Metadata = {
  title: "Watchlist | FinAI",
  description: "Track your favourite stocks across multiple watchlists",
};

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/watchlist");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 max-w-screen-xl mx-auto">
      <WatchlistClient />
    </main>
  );
}
