import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const reviewSchema = z.object({
  claimId: z.string().uuid(),
  action: z.enum(["approved", "rejected"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify caller is super_admin
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { claimId, action } = parsed.data;

  // Get the claim
  const { data: claim } = await admin
    .from("listing_claims")
    .select("id, business_id, claimant_id, status")
    .eq("id", claimId)
    .single();

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: "Claim already reviewed" },
      { status: 409 },
    );
  }

  // Update claim status
  await admin
    .from("listing_claims")
    .update({
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claimId);

  // If approved, transfer ownership
  if (action === "approved") {
    await admin
      .from("businesses")
      .update({
        owner_id: claim.claimant_id,
        claimed: true,
      })
      .eq("id", claim.business_id);

    // Reject other pending claims for this business
    await admin
      .from("listing_claims")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("business_id", claim.business_id)
      .eq("status", "pending")
      .neq("id", claimId);
  }

  return NextResponse.json({ success: true, action });
}
