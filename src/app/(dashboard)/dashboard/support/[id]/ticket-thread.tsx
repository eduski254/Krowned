"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Shield } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { replyToTicket } from "@/lib/support/actions";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
  profiles: any;
}

interface Props {
  ticketId: string;
  ticketStatus: string;
  messages: Message[];
  currentUserId: string;
  isAdmin: boolean;
}

export function TicketThread({ ticketId, ticketStatus, messages: initial, currentUserId, isAdmin }: Props) {
  const [messages, setMessages] = useState(initial);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isClosed = ticketStatus === "closed";

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setError(null);

    const replyText = reply.trim();
    setReply("");

    startTransition(async () => {
      const result = await replyToTicket({ ticketId, message: replyText });
      if (result.error) {
        setError(result.error);
        setReply(replyText);
      } else {
        // Optimistic add
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender_id: currentUserId,
            message: replyText,
            is_staff_reply: isAdmin,
            created_at: new Date().toISOString(),
            profiles: { full_name: isAdmin ? "Support Team" : "You", avatar_url: null },
          },
        ]);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          const name = (msg.profiles as any)?.full_name ?? (msg.is_staff_reply ? "Support Team" : "User");
          const avatar = (msg.profiles as any)?.avatar_url;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                msg.is_staff_reply
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground"
              }`}>
                {msg.is_staff_reply ? (
                  <Shield className="h-4 w-4" />
                ) : avatar ? (
                  <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                msg.is_staff_reply
                  ? "bg-primary/5 border border-primary/20"
                  : isOwn
                    ? "bg-muted"
                    : "bg-card border border-border"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {msg.is_staff_reply ? "Support Team" : name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {isClosed ? (
        <div className="rounded-lg border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
          This ticket is closed. If you need more help, please open a new ticket.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            maxLength={5000}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={isPending || !reply.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
