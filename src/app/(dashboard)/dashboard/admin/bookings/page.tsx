import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, status, source, service_amount, currency, services(name), businesses(name), clients:client_id(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        All Bookings
      </h1>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground">Service</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Business</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Client</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Source</th>
              <th className="px-4 py-3 text-right font-medium text-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {bookings?.map((b) => (
              <tr key={b.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-foreground">
                  {(b.services as unknown as { name: string } | null)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(b.businesses as unknown as { name: string } | null)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(b.clients as unknown as { full_name: string } | null)?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(b.starts_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === "completed"
                        ? "bg-success/10 text-success"
                        : b.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {b.source}
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {b.service_amount != null
                    ? `${(b.service_amount / 100).toFixed(2)} ${b.currency?.toUpperCase() ?? ""}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
