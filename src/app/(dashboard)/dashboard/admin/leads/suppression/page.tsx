import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SuppressionTable } from "@/components/admin/SuppressionTable";

export default async function SuppressionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: suppressions } = await admin
    .from("email_suppression")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Email Suppression List
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(suppressions ?? []).length} suppressed emails. Checked on every
          send path.
        </p>
      </div>
      <SuppressionTable rows={suppressions ?? []} />
    </div>
  );
}
