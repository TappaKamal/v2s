"use server";

import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const result = await authSignIn(email, password);
  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required" };
  }

  const result = await authSignUp(email, password, name);
  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  await authSignOut();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Email is required" };
  }
  
  const { requestPasswordReset } = await import("@/lib/auth");
  const result = await requestPasswordReset(email);
  return result; // contains token
}

export async function verifyOtpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;
  
  if (!email || !otp) {
    return { error: "Email and OTP are required" };
  }
  
  const { verifyOtp } = await import("@/lib/auth");
  const result = await verifyOtp(email, otp);
  return result;
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;
  const password = formData.get("password") as string;
  
  if (!email || !otp || !password) {
    return { error: "Email, OTP, and new password are required" };
  }
  
  const { verifyAndResetPassword } = await import("@/lib/auth");
  const result = await verifyAndResetPassword(email, otp, password);
  if (result.error) {
    return { error: result.error };
  }
  
  redirect("/dashboard");
}
