import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail } from "@/lib/email/resend";
import { newClaimRequestEmail } from "@/lib/email/templates";

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
    .select("id, name, claimed")
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

  // Notify super admins via email
  const { data: admins } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("platform_role", "super_admin");

  if (admins) {
    for (const adm of admins) {
      const { data: { user: admUser } } = await admin.auth.admin.getUserById(adm.id);
      if (admUser?.email) {
        const notification = newClaimRequestEmail({
          adminName: adm.full_name ?? "Admin",
          claimantName: fullName,
          claimantEmail: email,
          businessName: business.name,
          businessId,
          proofNotes: proofNotes ?? undefined,
        });
        sendEmail({ to: admUser.email, ...notification }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ claim }, { status: 201 });
}
