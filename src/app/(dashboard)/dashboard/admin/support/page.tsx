import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { AdminTicketFilters } from "./admin-ticket-filters";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-success/10 text-success", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-warning",
  urgent: "text-destructive font-semibold",
};

const CATEGORY_LABELS: Record<string, string> = {
  billing: "Billing",
  booking: "Booking",
  account: "Account",
  technical: "Technical",
  feature_request: "Feature",
  other: "Other",
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  let query = admin
    .from("support_tickets")
    .select("id, subject, category, priority, status, created_at, updated_at, user_id, assigned_to, profiles!user_id(full_name)")
    .order("updated_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: tickets } = await query;

  // Get counts per status
  const { data: allTickets } = await admin
    .from("support_tickets")
    .select("status");

  const counts: Record<string, number> = { all: allTickets?.length ?? 0 };
  for (const t of allTickets ?? []) {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground font-heading">Support Tickets</h1>
        <span className="text-sm text-muted-foreground">
          {counts.open ?? 0} open, {counts.in_progress ?? 0} in progress
        </span>
      </div>

      <AdminTicketFilters current={statusFilter ?? "all"} counts={counts} />

      {(tickets ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center mt-6">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No tickets match this filter.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {(tickets ?? []).map((ticket) => {
            const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
            const StatusIcon = status.icon;
            const userName = (ticket.profiles as any)?.full_name ?? "Unknown";

            return (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{userName}</span>
                    <span>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                    <span className={PRIORITY_COLORS[ticket.priority] ?? ""}>
                      {ticket.priority}
                    </span>
                    <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
