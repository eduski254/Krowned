import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { LeadsTable } from "@/components/admin/LeadsTable";

export default async function AdminLeadsPage() {
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

  const [leadsRes, settingsRes] = await Promise.all([
    admin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000),
    admin.from("crm_settings").select("*").limit(1).single(),
  ]);

  const leads = leadsRes.data ?? [];
  const settings = settingsRes.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground font-heading">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {leads.length} leads &middot; Nurture {settings?.nurture_paused ? "paused" : "active"}
          {settings?.dry_run ? " (dry run)" : ""}
        </p>
      </div>
      <LeadsTable rows={leads} settings={settings} />
    </div>
  );
}
