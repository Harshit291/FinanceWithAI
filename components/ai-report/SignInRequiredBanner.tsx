import { signIn } from "@/lib/auth/config";
import { AlertCircle, LogIn } from "lucide-react";

export function SignInRequiredBanner({ used, limit }: { used: number; limit: number }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 animate-fade-in-up">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-rose-500/10 shrink-0">
          <AlertCircle className="h-5 w-5 text-rose-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-rose-500 mb-2">
            Free Limit Reached
          </h3>
          <p className="text-sm leading-relaxed text-slate-300 mb-4">
            You have used your {limit} free searches for today. To keep exploring AI-driven fundamental analysis, please sign in with Google. It&apos;s 100% free!
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <LogIn className="h-4 w-4" />
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
