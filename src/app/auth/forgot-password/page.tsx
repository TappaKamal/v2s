"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, verifyOtpAction, resetPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for the wizard
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState<string | null>(null);

  async function handleEmailSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMockOtp(null);

    const emailInput = formData.get("email") as string;
    setEmail(emailInput);

    try {
      const result = await requestPasswordResetAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        if (result.token) {
          setMockOtp(result.token);
        }
        setStep("otp");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    const otpInput = formData.get("otp") as string;
    setOtp(otpInput);
    
    // We need to inject the email into the form data
    formData.append("email", email);

    try {
      const result = await verifyOtpAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setStep("password");
        setMockOtp(null);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    // Inject email and otp
    formData.append("email", email);
    formData.append("otp", otp);

    try {
      const result = await resetPasswordAction(formData);
      if (result && result.error) {
        setError(result.error);
      }
      // If success, the action redirects to /dashboard automatically
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
              {step === "password" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              ) : step === "otp" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              )}
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Verify Code"}
            {step === "password" && "Set New Password"}
          </h1>
          <p className="text-base text-slate-500 font-medium">
            {step === "email" && "Enter your email to receive a 6-digit code."}
            {step === "otp" && `Enter the 6-digit code sent to ${email}`}
            {step === "password" && "Please choose a strong password for your account."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {step === "otp" && mockOtp && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 text-center">
            <p className="text-sm text-slate-600 mb-2">
              (Demo) Your 6-digit verification code is:
            </p>
            <p className="text-2xl font-black tracking-widest text-green-700">{mockOtp}</p>
          </div>
        )}

        {step === "email" && (
          <form action={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">Email Address</label>
              <input name="email" type="email" required placeholder="you@example.com" defaultValue={email}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-xl px-4 py-3.5 text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form action={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">6-Digit Code</label>
              <input name="otp" type="text" required placeholder="123456" maxLength={6} pattern="\d{6}"
                className="w-full text-center tracking-[0.5em] bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-black placeholder:text-slate-300 placeholder:font-medium placeholder:tracking-normal" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-xl px-4 py-3.5 text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify Code"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form action={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">New Password</label>
              <input name="password" type="password" required placeholder="••••••••" minLength={6}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-xl px-4 py-3.5 text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save New Password"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          {step === "email" ? (
            <Link href="/auth/signin" className="text-base text-slate-500 hover:text-slate-900 font-bold transition-colors">
              Back to Sign In
            </Link>
          ) : (
            <button onClick={() => setStep("email")} className="text-base text-slate-500 hover:text-slate-900 font-bold transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
