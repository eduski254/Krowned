import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { User, Phone, Mail } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  bookingCount: number;
  type: "registered" | "contact";
}

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

  // Fetch registered clients (from bookings with client_id)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("client_id, contact_id, clients:client_id(id, full_name, avatar_url, phone)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Deduplicate registered clients
  const clientMap = new Map<string, ClientRow>();
  bookings?.forEach((b) => {
    if (b.client_id) {
      const client = b.clients as unknown as { id: string; full_name: string | null; avatar_url: string | null; phone: string | null } | null;
      if (!client) return;
      const existing = clientMap.get(client.id);
      if (existing) {
        existing.bookingCount++;
      } else {
        clientMap.set(client.id, {
          id: client.id,
          name: client.full_name ?? "Unknown",
          phone: client.phone,
          email: null,
          avatarUrl: client.avatar_url,
          bookingCount: 1,
          type: "registered",
        });
      }
    }
  });

  // Fetch business contacts
  const { data: contacts } = await supabase
    .from("business_contacts")
    .select("id, name, phone, email")
    .eq("business_id", business.id)
    .order("name");

  // Count bookings per contact
  const contactBookingCounts = new Map<string, number>();
  bookings?.forEach((b) => {
    if (b.contact_id) {
      contactBookingCounts.set(b.contact_id, (contactBookingCounts.get(b.contact_id) ?? 0) + 1);
    }
  });

  const contactRows: ClientRow[] = (contacts ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    avatarUrl: null,
    bookingCount: contactBookingCounts.get(c.id) ?? 0,
    type: "contact" as const,
  }));

  // Merge and sort: registered first, then contacts, by name
  const allClients = [
    ...Array.from(clientMap.values()),
    ...contactRows,
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Clients</h1>

      {allClients.length > 0 ? (
        <div className="space-y-3">
          {allClients.map((c) => (
            <div
              key={`${c.type}-${c.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.type === "contact" && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        contact
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </span>
                    )}
                  </div>
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
