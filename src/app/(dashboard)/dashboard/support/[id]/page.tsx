import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTicketWithMessages } from "@/lib/support/actions";
import { TicketThread } from "./ticket-thread";
import { AdminTicketControls } from "./admin-ticket-controls";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORY_LABELS: Record<string, string> = {
  billing: "Billing",
  booking: "Booking",
  account: "Account",
  technical: "Technical",
  feature_request: "Feature Request",
  other: "Other",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getTicketWithMessages(id);
  if (result.error || !result.ticket) notFound();

  const { ticket, messages, isAdmin } = result;

  return (
    <div>
      <Link
        href={isAdmin ? "/dashboard/admin/support" : "/dashboard/support"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      {/* Ticket header */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h1 className="text-xl font-bold text-foreground font-heading">
          {ticket.subject}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5">
            {CATEGORY_LABELS[ticket.category] ?? ticket.category}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5">
            {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
          </span>
          <span>
            Created {new Date(ticket.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <AdminTicketControls
          ticketId={ticket.id}
          currentStatus={ticket.status}
          currentPriority={ticket.priority}
        />
      )}

      {/* Thread */}
      <TicketThread
        ticketId={ticket.id}
        ticketStatus={ticket.status}
        messages={messages ?? []}
        currentUserId={user.id}
        isAdmin={isAdmin ?? false}
      />
    </div>
  );
}
