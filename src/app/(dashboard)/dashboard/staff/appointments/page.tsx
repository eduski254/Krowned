import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Calendar } from "lucide-react";

export default async function StaffAppointmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!staffRow) redirect("/dashboard/staff");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, services(name), clients:client_id(full_name)",
    )
    .eq("staff_id", staffRow.id)
    .order("starts_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Appointments</h1>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {(b.services as unknown as { name: string } | null)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(b.clients as unknown as { full_name: string } | null)?.full_name ?? "Client"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(b.starts_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {new Date(b.starts_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  b.status === "completed"
                    ? "bg-success/10 text-success"
                    : b.status === "cancelled"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary"
                }`}
              >
                {b.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No appointments"
          description="Your appointments will appear here."
        />
      )}
    </div>
  );
}
