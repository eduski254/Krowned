"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

export type ConversationPreview = {
  id: string;
  other_party_name: string;
  last_message_body: string | null;
  last_message_at: string | null;
  unread_count: number;
  booking_id: string | null;
};

export function ConversationList({
  conversations,
  basePath,
  emptyMessage,
}: {
  conversations: ConversationPreview[];
  basePath: string;
  emptyMessage?: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          No messages yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptyMessage || "When you start a conversation, it will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((convo) => (
        <Link
          key={convo.id}
          href={`${basePath}/${convo.id}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
        >
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {(convo.other_party_name || "?").charAt(0).toUpperCase()}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`truncate text-sm ${
                  convo.unread_count > 0
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground"
                }`}
              >
                {convo.other_party_name}
              </p>
              {convo.last_message_at && (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatRelativeTime(convo.last_message_at)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm text-muted-foreground">
                {convo.last_message_body || "No messages yet"}
              </p>
              {convo.unread_count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {convo.unread_count > 9 ? "9+" : convo.unread_count}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
