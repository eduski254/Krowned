import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { User } from "lucide-react";

export default async function StaffClientsPage() {
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
    .select("client_id, clients:client_id(id, full_name, avatar_url)")
    .eq("staff_id", staffRow.id);

  const clientMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null; count: number }>();
  bookings?.forEach((b) => {
    const c = b.clients as unknown as { id: string; full_name: string | null; avatar_url: string | null } | null;
    if (!c) return;
    const existing = clientMap.get(c.id);
    if (existing) existing.count++;
    else clientMap.set(c.id, { ...c, count: 1 });
  });
  const clients = Array.from(clientMap.values());

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Clients</h1>

      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {(c.full_name ?? "?").charAt(0)}
                </div>
                <p className="font-medium text-foreground">
                  {c.full_name ?? "Unknown"}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {c.count} visit{c.count !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={User}
          title="No clients yet"
          description="Clients you've served will appear here."
        />
      )}
    </div>
  );
}
