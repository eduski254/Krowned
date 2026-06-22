import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plans } = await supabase
    .from("plans")
    .select("id, tier, name, base_price, per_seat_price, currency, trial_days, is_active")
    .order("tier");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Platform Settings
      </h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Plans</h2>
          <div className="mt-4 space-y-3">
            {plans?.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.tier} — {p.trial_days} day trial
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {(p.base_price / 100).toFixed(2)} + {(p.per_seat_price / 100).toFixed(2)}/seat
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.currency?.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
