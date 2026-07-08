import { createClient } from "@/lib/supabase/server";
import { getImpersonatedUserId } from "@/lib/impersonate";

/**
 * Returns the effective user ID for dashboard pages.
 * If a super admin is impersonating someone, returns the target user's ID.
 * Otherwise returns the authenticated user's ID.
 *
 * Returns null if not authenticated.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const impersonateId = await getImpersonatedUserId();
  if (impersonateId && impersonateId !== user.id) {
    // Verify caller is super admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.platform_role === "super_admin") {
      return impersonateId;
    }
  }

  return user.id;
}
