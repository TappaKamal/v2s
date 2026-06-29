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
