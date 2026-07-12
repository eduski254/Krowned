import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Temporary diagnostic endpoint to debug the business query.
 * DELETE THIS FILE once the bug is resolved.
 *
 * GET /api/debug-business
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated", authError }, { status: 401 });
  }

  // Query with user's RLS client
  const { data: rlsBusiness, error: rlsError } = await supabase
    .from("businesses")
    .select("id, name, slug, owner_id, verification_status, is_published")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Query with admin client (bypasses RLS) for comparison
  const admin = createAdminClient();
  const { data: adminBusiness, error: adminError } = await admin
    .from("businesses")
    .select("id, name, slug, owner_id, verification_status, is_published")
    .eq("owner_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    authUid: user.id,
    userEmail: user.email,
    rlsQuery: { data: rlsBusiness, error: rlsError?.message ?? null },
    adminQuery: { data: adminBusiness, error: adminError?.message ?? null },
    mismatch: !rlsBusiness && !!adminBusiness
      ? "RLS is blocking the row — auth.uid() likely doesn't match in the RLS context"
      : null,
  });
}
