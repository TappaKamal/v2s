"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccessLink(null);

    try {
      const result = await requestPasswordResetAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // In a real app, this would send an email. For now, show the link.
        if (result.token) {
          const url = new URL(window.location.href);
          const resetUrl = `${url.origin}/auth/reset-password?token=${result.token}`;
          setSuccessLink(resetUrl);
        } else {
          // If token isn't returned (e.g. email not found to prevent enumeration)
          setSuccessLink("If an account exists, a reset link was generated.");
        }
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 sm:p-8">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-10 relative z-10 border border-slate-100">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Forgot Password</h1>
          <p className="text-base text-slate-500 font-medium">Enter your email to receive a reset link.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {successLink ? (
          <div className="mb-6 p-6 bg-green-50 rounded-xl border border-green-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Processed</h3>
            <p className="text-sm text-slate-600 mb-4">
              Normally we would email you a link. For this demo, here is your reset link:
            </p>
            {successLink.startsWith("http") ? (
              <a href={successLink} className="inline-block px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors break-all text-sm">
                Click here to reset password
              </a>
            ) : (
              <p className="text-sm font-bold text-slate-800">{successLink}</p>
            )}
          </div>
        ) : (
          <form action={onSubmit} className="space-y-6">
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">Email Address</label>
              <input name="email" type="email" required placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-xl px-4 py-3.5 text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/auth/signin" className="text-base text-slate-500 hover:text-slate-900 font-bold transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
