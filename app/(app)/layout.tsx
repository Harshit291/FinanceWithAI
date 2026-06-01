import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { FinAILogo } from "@/components/ui/FinAILogo";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
