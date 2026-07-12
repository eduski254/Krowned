import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole = "super_admin" | "business_owner" | "staff" | "client";

/**
 * Derive a user's primary role from their relationships in the database.
 * Order: super_admin > business_owner > staff > client.
 * A user can be multiple things, but we route to their "highest" role dashboard.
 *
 * Uses the admin client to bypass RLS — the caller is responsible for verifying
 * the user is authenticated before calling this.
 */
export async function getUserRole(
  _supabase: SupabaseClient,
  userId: string,
): Promise<AppRole> {
  const admin = createAdminClient();

  // Check profile for super admin
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", userId)
    .single();

  if (profile?.platform_role === "super_admin") return "super_admin";

  // Check if user owns a business
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (business) return "business_owner";

  // Check if user is staff somewhere
  const { data: staff } = await admin
    .from("staff")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (staff) return "staff";

  return "client";
}

/** Map role to its dashboard home path */
export function roleDashboardPath(role: AppRole): string {
  switch (role) {
    case "super_admin":
      return "/dashboard/admin";
    case "business_owner":
      return "/dashboard/business";
    case "staff":
      return "/dashboard/staff";
    case "client":
      return "/dashboard";
  }
}
