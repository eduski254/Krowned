import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const markReadSchema = z.object({
  conversationId: z.string().uuid(),
});

/**
 * POST /api/messages/read — Mark messages as read
 * Updates conversation_participants.last_read_at for the current user.
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
  const parsed = markReadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { conversationId } = parsed.data;
  const admin = createAdminClient();

  // Verify participant
  const { data: participant } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update last_read_at
  const { error } = await admin
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to mark as read:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
