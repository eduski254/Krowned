"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  message?: string;
} | null;

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    account_type: formData.get("account_type"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { full_name, email, password, account_type } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        account_type, // stored in raw_user_meta_data for post-signup routing
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function loginWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?message=" + encodeURIComponent(error.message));
  }

  redirect(data.url);
}

export async function forgotPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = { email: formData.get("email") };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password` },
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Check your email for a reset link." };
}

export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = { password: formData.get("password") };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Password+updated.+Please+log+in.");
}

export async function logout(message?: string) {
  const supabase = await createClient();
  // scope: 'global' revokes all sessions (all devices), ensuring a full signout
  await supabase.auth.signOut({ scope: "global" });
  const url = message
    ? `/login?message=${encodeURIComponent(message)}`
    : "/login";
  redirect(url);
}

/** Form-action-compatible logout (no params). Use in <form action={logoutAction}>. */
export async function logoutAction() {
  await logout();
}
