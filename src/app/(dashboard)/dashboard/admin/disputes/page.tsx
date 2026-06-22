import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AlertTriangle } from "lucide-react";

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: disputes } = await supabase
    .from("disputes")
    .select(
      "id, reason, status, created_at, raised:raised_by(full_name), bookings(id, services(name), businesses(name))",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Disputes</h1>

      {disputes && disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">
                  {(d.raised as unknown as { full_name: string } | null)?.full_name ?? "User"}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.status === "open"
                      ? "bg-warning/10 text-warning"
                      : d.status === "resolved"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{d.reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(d.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="No disputes"
          description="Disputes raised by users will appear here."
        />
      )}
    </div>
  );
}
