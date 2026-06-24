import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/admin/UsersTable";

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
    .limit(500);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Users</h1>
      <UsersTable rows={profiles ?? []} />
    </div>
  );
}
