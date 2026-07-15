import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { LeadDetail } from "@/components/admin/LeadDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

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

  const [leadRes, emailsRes] = await Promise.all([
    admin.from("leads").select("*").eq("id", id).single(),
    admin
      .from("lead_emails")
      .select("*")
      .eq("lead_id", id)
      .order("step", { ascending: true }),
  ]);

  if (!leadRes.data) notFound();

  return (
    <LeadDetail
      lead={leadRes.data}
      emails={emailsRes.data ?? []}
    />
  );
}
