import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminBusinessesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, city, country, verification_status, subscription_status, is_published, owner:owner_id(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Businesses</h1>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Location</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {businesses?.map((b) => (
              <tr key={b.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/b/${b.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {b.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(b.owner as unknown as { full_name: string } | null)?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[b.city, b.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.verification_status === "verified"
                        ? "bg-success/10 text-success"
                        : b.verification_status === "suspended"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {b.verification_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.subscription_status === "active" || b.subscription_status === "trialing"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.subscription_status ?? "free"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
