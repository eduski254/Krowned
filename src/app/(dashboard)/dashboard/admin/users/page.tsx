import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { UsersTable, type UserRow } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profiles, businesses, and staff in parallel
  const [profilesRes, businessesRes, staffRes, authUsersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, country, platform_role, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("businesses").select("id, name, owner_id"),
    supabase.from("staff").select("user_id, business_id, status").eq("status", "active"),
    // Get auth users for emails + ban status (paginated)
    fetchAllAuthUsers(),
  ]);

  const profiles = profilesRes.data ?? [];
  const businesses = businessesRes.data ?? [];
  const staffRows = staffRes.data ?? [];

  // Build lookup maps
  const ownerBizMap = new Map<string, string>();
  const bizNameMap = new Map<string, string>();
  for (const b of businesses) {
    ownerBizMap.set(b.owner_id, b.name);
    bizNameMap.set(b.id, b.name);
  }

  const staffBizMap = new Map<string, string>();
  for (const s of staffRows) {
    if (s.user_id && !staffBizMap.has(s.user_id)) {
      staffBizMap.set(s.user_id, bizNameMap.get(s.business_id) ?? "");
    }
  }

  const staffUserIds = new Set(staffRows.map((s) => s.user_id).filter(Boolean));

  const authUserMap = new Map(
    authUsersRes.map((u) => [u.id, { email: u.email, is_banned: !!u.banned_until }]),
  );

  // Derive roles and build rows
  const rows: UserRow[] = profiles.map((p) => {
    const authInfo = authUserMap.get(p.id);
    let derived_role: UserRow["derived_role"] = "client";
    let business_name: string | null = null;

    if (p.platform_role === "super_admin") {
      derived_role = "super_admin";
    } else if (ownerBizMap.has(p.id)) {
      derived_role = "business_owner";
      business_name = ownerBizMap.get(p.id)!;
    } else if (staffUserIds.has(p.id)) {
      derived_role = "staff";
      business_name = staffBizMap.get(p.id) ?? null;
    }

    return {
      id: p.id,
      full_name: p.full_name,
      email: authInfo?.email ?? null,
      phone: p.phone,
      country: p.country,
      platform_role: p.platform_role,
      created_at: p.created_at,
      is_banned: authInfo?.is_banned ?? false,
      derived_role,
      business_name,
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} total users across the platform
          </p>
        </div>
      </div>
      <UsersTable rows={rows} />
    </div>
  );
}

async function fetchAllAuthUsers() {
  const admin = createAdminClient();
  const allUsers: Array<{
    id: string;
    email?: string;
    banned_until?: string | null;
  }> = [];

  for (let page = 1; page <= 50; page++) {
    const {
      data: { users },
    } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    allUsers.push(
      ...users.map((u) => ({
        id: u.id,
        email: u.email,
        banned_until: u.banned_until as string | null | undefined,
      })),
    );
    if (users.length < 100) break;
  }

  return allUsers;
}
