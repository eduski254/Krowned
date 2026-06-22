import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export default async function BusinessSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, default_payment_option, is_published")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Business Settings
      </h1>

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Visibility</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your business is currently{" "}
            <strong>{business.is_published ? "published" : "unpublished"}</strong>.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Default Payment Option
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current default: <strong>{business.default_payment_option ?? "Not set"}</strong>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Individual services can override this.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Business Hours
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your opening hours so staff schedules compute correctly.
          </p>
          {/* // REVIEW: Business hours editor */}
        </div>
      </div>
    </div>
  );
}
