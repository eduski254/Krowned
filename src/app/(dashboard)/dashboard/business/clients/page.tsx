import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { User } from "lucide-react";

export default async function BusinessClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  // Get unique clients who have booked with this business
  const { data: bookings } = await supabase
    .from("bookings")
    .select("client_id, clients:client_id(id, full_name, avatar_url, phone)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Deduplicate clients
  const clientMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null; phone: string | null; bookingCount: number }>();
  bookings?.forEach((b) => {
    const client = b.clients as unknown as { id: string; full_name: string | null; avatar_url: string | null; phone: string | null } | null;
    if (!client) return;
    const existing = clientMap.get(client.id);
    if (existing) {
      existing.bookingCount++;
    } else {
      clientMap.set(client.id, { ...client, bookingCount: 1 });
    }
  });
  const clients = Array.from(clientMap.values());

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Clients</h1>

      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {(c.full_name ?? "?").charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {c.full_name ?? "Unknown"}
                  </p>
                  {c.phone && (
                    <p className="text-sm text-muted-foreground">{c.phone}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {c.bookingCount} booking{c.bookingCount !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={User}
          title="No clients yet"
          description="Your client list will grow as people book your services."
        />
      )}
    </div>
  );
}
