"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions/auth";
import { Stethoscope } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    const result = await signInAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8] p-4 relative overflow-hidden font-sans">
      <div className="absolute top-20 -left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-teal-500 p-2.5 rounded-xl shadow-md shadow-green-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">LifeSaver AI</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Portal</h1>
          <p className="text-slate-500 font-medium mt-2">Log in to view your chart</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Email Address</label>
              <input name="email" type="email" required placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Password</label>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white h-12 text-[15px] font-bold shadow-lg shadow-green-600/25 transition-all">
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-[15px] font-medium text-slate-500 mt-6 pt-6 border-t border-slate-100">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-green-600 font-bold hover:underline">Book a session</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

