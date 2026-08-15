import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  ConversationList,
  type ConversationPreview,
} from "@/components/messaging/conversation-list";

export const dynamic = "force-dynamic";

export default async function ClientMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch conversations where user is the client
  const { data: conversations } = await admin
    .from("conversations")
    .select(
      `
      id,
      business_id,
      booking_id,
      last_message_at,
      businesses!conversations_business_id_fkey(name)
    `,
    )
    .eq("client_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (!conversations || conversations.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground font-heading">
          Messages
        </h1>
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No messages yet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When you message a business, your conversations will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Build previews with last message + unread count
  const previews: ConversationPreview[] = await Promise.all(
    conversations.map(async (convo) => {
      // Get last message
      const { data: lastMsg } = await admin
        .from("messages")
        .select("body")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get user's last_read_at
      const { data: participant } = await admin
        .from("conversation_participants")
        .select("last_read_at")
        .eq("conversation_id", convo.id)
        .eq("user_id", user.id)
        .maybeSingle();

      // Count unread messages (messages after last_read_at that aren't from this user)
      let unreadCount = 0;
      if (participant) {
        let countQuery = admin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", convo.id)
          .neq("sender_id", user.id);

        if (participant.last_read_at) {
          countQuery = countQuery.gt("created_at", participant.last_read_at);
        }

        const { count } = await countQuery;
        unreadCount = count ?? 0;
      }

      const biz = convo.businesses as unknown as { name: string } | null;

      return {
        id: convo.id,
        other_party_name: biz?.name || "Unknown Business",
        last_message_body: lastMsg?.body ?? null,
        last_message_at: convo.last_message_at,
        unread_count: unreadCount,
        booking_id: convo.booking_id,
      };
    }),
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground font-heading">
        Messages
      </h1>
      <ConversationList
        conversations={previews}
        basePath="/dashboard/messages"
      />
    </div>
  );
}
