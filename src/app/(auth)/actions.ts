"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  message?: string;
  email?: string;
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

  // If signup came from a staff invite, store the redirect so /confirm can route back
  const inviteRedirect = formData.get("redirect") as string | null;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        account_type, // stored in raw_user_meta_data for post-signup routing
        ...(inviteRedirect ? { invite_redirect: inviteRedirect } : {}),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app"}/auth/callback?next=${
        inviteRedirect ?? (account_type === "professional" ? "/dashboard/business/onboarding" : "/dashboard")
      }`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Fire-and-forget welcome email (role-specific copy)
  const welcome = welcomeEmail(full_name, account_type);
  sendEmail({ to: email, ...welcome }).catch(() => {});

  // For professionals: create a business row so onboarding can populate it
  // Use admin client since user has no session until email is confirmed
  if (account_type === "professional" && signUpData.user) {
    const admin = createAdminClient();
    // Get free plan
    const { data: freePlan } = await admin
      .from("plans")
      .select("id")
      .eq("tier", "free")
      .single();

    if (freePlan) {
      const slug = full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        + "-" + Date.now().toString(36);

      await admin.from("businesses").insert({
        owner_id: signUpData.user.id,
        name: `${full_name}'s Business`,
        slug,
        plan_id: freePlan.id,
        is_published: false,
        verification_status: "pending",
        booking_link_token: crypto.randomUUID(),
      });
    }
  }

  // Email confirmation is required — show success message instead of redirecting
  return {
    success: true,
    message: "Check your email for a confirmation link to activate your account.",
    email,
  };
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

  // Support redirect param for post-login routing (e.g. staff invite accept)
  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo);
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

/** Resend the signup confirmation email */
export async function resendConfirmation(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: "Email is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
