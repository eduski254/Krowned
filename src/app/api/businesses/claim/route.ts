import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const claimSchema = z.object({
  businessId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  proofNotes: z.string().max(1000).optional(),
  proofImageUrl: z.string().url().optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { businessId, fullName, email, phone, proofNotes, proofImageUrl } = parsed.data;
  const admin = createAdminClient();

  // Verify business exists and is unclaimed
  const { data: business } = await admin
    .from("businesses")
    .select("id, claimed")
    .eq("id", businessId)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (business.claimed) {
    return NextResponse.json(
      { error: "This listing has already been claimed" },
      { status: 409 },
    );
  }

  // Check for existing pending claim by this user
  const { data: existing } = await admin
    .from("listing_claims")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("claimant_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "pending"
            ? "You already have a pending claim for this listing"
            : "You have already submitted a claim for this listing",
      },
      { status: 409 },
    );
  }

  // Create claim
  const { data: claim, error } = await admin
    .from("listing_claims")
    .insert({
      business_id: businessId,
      claimant_id: user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      proof_notes: proofNotes || null,
      proof_image_url: proofImageUrl || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim }, { status: 201 });
}
