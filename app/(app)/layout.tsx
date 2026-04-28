import { FinAILogo } from "@/components/ui/FinAILogo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-4 sm:px-6 lg:px-8">
          <FinAILogo />
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
