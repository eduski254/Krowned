"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { staffInviteSchema } from "@/lib/validations/service";
import { sendEmail } from "@/lib/email/resend";
import { staffInvitationEmail } from "@/lib/email/templates";

export type StaffFormState = {
  error?: string;
  success?: boolean;
} | null;

export async function inviteStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return { error: "No business found" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = staffInviteSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const { email, display_name, title } = parsed.data;

  // Check if staff already exists for this business
  const { data: existing } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", business.id)
    .eq("invited_email", email)
    .maybeSingle();

  if (existing) {
    return { error: "This email has already been invited" };
  }

  const invite_token = crypto.randomUUID();
  const invite_expires_at = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("staff").insert({
    business_id: business.id,
    invited_email: email,
    display_name,
    title: title || null,
    invite_token,
    invite_expires_at,
    status: "invited" as const,
  });

  if (error) return { error: error.message };

  // Fetch business name for the email
  const { data: bizDetails } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", business.id)
    .single();

  // Fetch inviter's name
  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fire-and-forget staff invitation email
  const mail = staffInvitationEmail({
    staffName: display_name,
    businessName: bizDetails?.name ?? "a business",
    inviteToken: invite_token,
    invitedBy: inviterProfile?.full_name ?? "A business owner",
  });
  sendEmail({ to: email, ...mail }).catch(() => {});

  redirect("/dashboard/business/staff");
}

export async function removeStaff(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return;

  const staffId = formData.get("staff_id") as string;
  if (!staffId) return;

  // Set to inactive rather than deleting (preserves history)
  await supabase
    .from("staff")
    .update({ status: "inactive" as const })
    .eq("id", staffId)
    .eq("business_id", business.id);

  redirect("/dashboard/business/staff");
}
