import { RegisterForm } from "@/components/auth/RegisterForm";
import { FinAILogo } from "@/components/ui/FinAILogo";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-8 space-y-6 shadow-2xl shadow-black/40">
      {/* Logo + heading */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <FinAILogo />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">Create account</h1>
          <p className="text-xs font-mono text-slate-500">Start researching stocks with AI</p>
        </div>
      </div>
      <RegisterForm />
      <p className="text-center text-xs font-mono text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
