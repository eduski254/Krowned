import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DollarSign } from "lucide-react";

export default async function StaffEarningsPage() {
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

  // Staff earnings are derived from completed bookings assigned to them
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, service_amount, tip_amount, currency, starts_at")
    .eq("staff_id", staffRow.id)
    .eq("status", "completed")
    .order("starts_at", { ascending: false })
    .limit(50);

  const totalService = bookings?.reduce((s, b) => s + (b.service_amount ?? 0), 0) ?? 0;
  const totalTips = bookings?.reduce((s, b) => s + (b.tip_amount ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Earnings</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Service Revenue</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {(totalService / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Tips</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {(totalTips / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {bookings && bookings.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Recent Completed Bookings
          </h2>
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(b.starts_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="font-medium text-foreground">
                  {((b.service_amount ?? 0) / 100).toFixed(2)}{" "}
                  {b.tip_amount ? `+ ${(b.tip_amount / 100).toFixed(2)} tip` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={DollarSign}
          title="No earnings yet"
          description="Earnings from completed appointments will show here."
        />
      )}
    </div>
  );
}
