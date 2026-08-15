import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  body: z.string().min(1).max(5000),
});

/**
 * POST /api/messages — Send a message
 * If conversationId is provided, sends to existing conversation.
 * If businessId is provided (no conversationId), finds or creates conversation.
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
  const parsed = sendMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { conversationId, businessId, bookingId, body } = parsed.data;
  const admin = createAdminClient();

  let convoId = conversationId;

  if (!convoId) {
    // Must have businessId to create/find conversation
    if (!businessId) {
      return NextResponse.json(
        { error: "conversationId or businessId required" },
        { status: 400 },
      );
    }

    // Verify the business exists
    const { data: biz } = await admin
      .from("businesses")
      .select("id, owner_id")
      .eq("id", businessId)
      .single();

    if (!biz) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Don't let a business owner message their own business
    if (biz.owner_id === user.id) {
      return NextResponse.json(
        { error: "Cannot message your own business" },
        { status: 400 },
      );
    }

    // Find existing conversation between this client and business
    // (optionally scoped to a booking)
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
      convoId = existing.id;
    } else {
      // Create a new conversation
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

      convoId = newConvo.id;

      // Add participants: client + business owner
      await admin.from("conversation_participants").insert([
        { conversation_id: convoId, user_id: user.id },
        { conversation_id: convoId, user_id: biz.owner_id },
      ]);
    }
  } else {
    // Verify the user is a participant
    const { data: participant } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", convoId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Insert the message
  const { data: message, error: msgErr } = await admin
    .from("messages")
    .insert({
      conversation_id: convoId,
      sender_id: user.id,
      body,
    })
    .select("id, conversation_id, sender_id, body, created_at")
    .single();

  if (msgErr || !message) {
    console.error("Failed to send message:", msgErr);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }

  // Update last_message_at on the conversation
  await admin
    .from("conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", convoId);

  return NextResponse.json({ message, conversationId: convoId });
}
