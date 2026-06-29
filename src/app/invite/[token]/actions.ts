"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function acceptStaffInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch invite
  const { data: staff } = await admin
    .from("staff")
    .select("id, invited_email, invite_expires_at, status, business_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!staff) throw new Error("Invalid invitation");
  if (staff.status !== "invited") throw new Error("Invitation already used");
  if (
    staff.invite_expires_at &&
    new Date(staff.invite_expires_at) < new Date()
  ) {
    throw new Error("Invitation expired");
  }

  // Verify email matches
  if (user.email?.toLowerCase() !== staff.invited_email?.toLowerCase()) {
    throw new Error("Email does not match invitation");
  }

  // Activate the staff record and link to user
  const { error } = await admin
    .from("staff")
    .update({
      user_id: user.id,
      status: "active" as const,
      invite_token: null,
      invite_expires_at: null,
    })
    .eq("id", staff.id);

  if (error) throw new Error(error.message);

  // Ensure the user has a profile (they might be new)
  await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        email: user.email ?? "",
      },
      { onConflict: "id" },
    );

  redirect("/dashboard/staff");
}
