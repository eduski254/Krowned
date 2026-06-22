import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, country, platform_role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Users</h1>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Country</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {profiles?.map((p) => (
              <tr key={p.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">
                  {p.full_name || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.country || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.platform_role === "super_admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.platform_role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
