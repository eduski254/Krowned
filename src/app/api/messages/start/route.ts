import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const startConvoSchema = z.object({
  businessId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
});

/**
 * POST /api/messages/start — Find or create a conversation, return its ID.
 * Used by the "Message" button on business profiles.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rawBody = await req.json();
  const parsed = startConvoSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { businessId, bookingId } = parsed.data;
  const admin = createAdminClient();

  // Verify the business exists
  const { data: biz } = await admin
    .from("businesses")
    .select("id, owner_id")
    .eq("id", businessId)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Don't let the owner message their own business
  if (biz.owner_id === user.id) {
    return NextResponse.json(
      { error: "Cannot message your own business" },
      { status: 400 },
    );
  }

  // Find existing conversation
  let findQuery = admin
    .from("conversations")
    .select("id")
    .eq("business_id", businessId)
    .eq("client_id", user.id);

  if (bookingId) {
    findQuery = findQuery.eq("booking_id", bookingId);
  } else {
    findQuery = findQuery.is("booking_id", null);
  }

  const { data: existing } = await findQuery.maybeSingle();

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  // Create new conversation
  const { data: newConvo, error: convoErr } = await admin
    .from("conversations")
    .insert({
      business_id: businessId,
      client_id: user.id,
      booking_id: bookingId ?? null,
    })
    .select("id")
    .single();

  if (convoErr || !newConvo) {
    console.error("Failed to create conversation:", convoErr);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }

  // Add participants
  await admin.from("conversation_participants").insert([
    { conversation_id: newConvo.id, user_id: user.id },
    { conversation_id: newConvo.id, user_id: biz.owner_id },
  ]);

  return NextResponse.json({ conversationId: newConvo.id });
}
