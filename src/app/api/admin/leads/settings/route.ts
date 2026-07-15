import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") return null;
  return user;
}

/** PATCH — Update CRM settings */
export async function PATCH(request: Request) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await request.json();
  const admin = createAdminClient();

  // Get the singleton row ID
  const { data: settings } = await admin
    .from("crm_settings")
    .select("id")
    .limit(1)
    .single();

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("crm_settings")
    .update(updates)
    .eq("id", settings.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
