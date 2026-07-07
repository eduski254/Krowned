"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const COOKIE_NAME = "zawadi_impersonate";

/** Start impersonating a user. Only super admins can do this. */
export async function startImpersonation(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify caller is super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour max
  });

  return { ok: true };
}

/** Stop impersonating and return to admin dashboard. */
export async function stopImpersonation() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect("/dashboard/admin");
}

/** Read the impersonation target user ID (if any). */
export async function getImpersonatedUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
