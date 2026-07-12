import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Scissors, Plus } from "lucide-react";
import Link from "next/link";

export default async function BusinessServicesPage() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  const { data: services } = await admin
    .from("services")
    .select(
      "id, name, description, price_amount, currency, duration_minutes, payment_option, is_active, service_categories(name)",
    )
    .eq("business_id", business.id)
    .order("name");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <Link
          href="/dashboard/business/services/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      {services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/business/services/${s.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{s.name}</p>
                  {!s.is_active && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(s.service_categories as unknown as { name: string } | null)?.name ?? "Uncategorized"}
                  {" — "}
                  {s.duration_minutes} min — {s.payment_option}
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {(s.price_amount / 100).toFixed(2)}{" "}
                <span className="text-sm text-muted-foreground">
                  {s.currency?.toUpperCase()}
                </span>
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Scissors}
          title="No services yet"
          description="Add your first service so clients can start booking."
          action={
            <Link
              href="/dashboard/business/services/new"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Add Service
            </Link>
          }
        />
      )}
    </div>
  );
}
