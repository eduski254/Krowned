import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { MessageThread } from "@/components/messaging/message-thread";

export const dynamic = "force-dynamic";

export default async function ClientMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch conversation and verify the user is a participant
  const { data: conversation } = await admin
    .from("conversations")
    .select(
      `
      id,
      business_id,
      client_id,
      booking_id,
      businesses!conversations_business_id_fkey(name, owner_id)
    `,
    )
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  // Verify user is the client in this conversation
  if (conversation.client_id !== user.id) {
    // Check if they're a participant (e.g., staff)
    const { data: participantCheck } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!participantCheck) notFound();
  }

  // Fetch messages
  const { data: messages } = await admin
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Fetch participants with profiles
  const { data: participantRows } = await admin
    .from("conversation_participants")
    .select("user_id, profiles!conversation_participants_user_id_fkey(full_name, avatar_url)")
    .eq("conversation_id", conversationId);

  const participants = (participantRows ?? []).map((p) => {
    const profile = p.profiles as unknown as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
    return {
      user_id: p.user_id,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });

  const biz = conversation.businesses as unknown as {
    name: string;
    owner_id: string;
  } | null;

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={user.id}
      initialMessages={messages ?? []}
      participants={participants}
      otherPartyName={biz?.name || "Business"}
      backHref="/dashboard/messages"
    />
  );
}
