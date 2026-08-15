import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthedBusiness } from "@/lib/business-auth";
import { redirect, notFound } from "next/navigation";
import { MessageThread } from "@/components/messaging/message-thread";

export const dynamic = "force-dynamic";

export default async function BusinessMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = await params;

  const { userId, business } = await getAuthedBusiness();
  if (!userId) redirect("/login");
  if (!business) redirect("/dashboard/business/onboarding");

  const admin = createAdminClient();

  // Fetch conversation and verify it belongs to this business
  const { data: conversation } = await admin
    .from("conversations")
    .select(
      `
      id,
      business_id,
      client_id,
      booking_id,
      profiles!conversations_client_id_fkey(full_name, avatar_url)
    `,
    )
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();
  if (conversation.business_id !== business.id) notFound();

  // Fetch messages
  const { data: messages } = await admin
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Fetch participants with profiles
  const { data: participantRows } = await admin
    .from("conversation_participants")
    .select(
      "user_id, profiles!conversation_participants_user_id_fkey(full_name, avatar_url)",
    )
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

  const client = conversation.profiles as unknown as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={userId}
      initialMessages={messages ?? []}
      participants={participants}
      otherPartyName={client?.full_name || "Client"}
      backHref="/dashboard/business/messages"
    />
  );
}
