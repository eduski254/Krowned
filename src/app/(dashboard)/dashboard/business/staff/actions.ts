"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, owner_id")
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

  // Check if staff already exists for this business (any status)
  const { data: existing } = await admin
    .from("staff")
    .select("id, status")
    .eq("business_id", business.id)
    .eq("invited_email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status === "inactive") {
      // Reactivate: update the existing record with a fresh invite
      const invite_token = crypto.randomUUID();
      const invite_expires_at = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      await admin
        .from("staff")
        .update({
          display_name,
          title: title || null,
          invite_token,
          invite_expires_at,
          status: "invited" as const,
          user_id: null, // clear old link so they re-accept
        })
        .eq("id", existing.id);

      // Fetch inviter's name
      const { data: inviterProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const mail = staffInvitationEmail({
        staffName: display_name,
        businessName: business.name ?? "a business",
        inviteToken: invite_token,
        invitedBy: inviterProfile?.full_name ?? "A business owner",
      });
      sendEmail({ to: email, ...mail }).catch(() => {});

      redirect("/dashboard/business/staff");
    }

    return { error: "This email has already been invited" };
  }

  const invite_token = crypto.randomUUID();
  const invite_expires_at = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await admin.from("staff").insert({
    business_id: business.id,
    invited_email: email,
    display_name,
    title: title || null,
    invite_token,
    invite_expires_at,
    status: "invited" as const,
  });

  if (error) return { error: error.message };

  // Fetch inviter's name
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fire-and-forget staff invitation email
  const mail = staffInvitationEmail({
    staffName: display_name,
    businessName: business.name ?? "a business",
    inviteToken: invite_token,
    invitedBy: inviterProfile?.full_name ?? "A business owner",
  });
  sendEmail({ to: email, ...mail }).catch(() => {});

  redirect("/dashboard/business/staff");
}

/**
 * Deactivate a staff member (preserves booking/review history).
 */
export async function deactivateStaff(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return;

  const staffId = formData.get("staff_id") as string;
  if (!staffId) return;

  // Protect owner's staff record
  const { data: staffMember } = await admin
    .from("staff")
    .select("user_id")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .single();

  if (!staffMember) return;
  if (staffMember.user_id === business.owner_id) return; // can't deactivate yourself

  await admin
    .from("staff")
    .update({ status: "inactive" as const })
    .eq("id", staffId)
    .eq("business_id", business.id);

  redirect("/dashboard/business/staff");
}

/**
 * Reactivate an inactive staff member.
 */
export async function reactivateStaff(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return;

  const staffId = formData.get("staff_id") as string;
  if (!staffId) return;

  await admin
    .from("staff")
    .update({ status: "active" as const })
    .eq("id", staffId)
    .eq("business_id", business.id);

  redirect(`/dashboard/business/staff/${staffId}`);
}

/**
 * Hard-delete a staff member.
 * Only allowed if they have no bookings (FK would block anyway).
 * For invited/pending staff, this always works since they have no bookings.
 */
export async function deleteStaff(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return { error: "No business found" };

  const staffId = formData.get("staff_id") as string;
  if (!staffId) return { error: "Missing staff ID" };

  // Fetch staff to verify ownership and protect owner record
  const { data: staffMember } = await admin
    .from("staff")
    .select("user_id, status")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .single();

  if (!staffMember) return { error: "Staff not found" };
  if (staffMember.user_id === business.owner_id) {
    return { error: "You cannot delete your own staff record" };
  }

  // Check if staff has any bookings (staff_id is NOT NULL on bookings/reviews, so FK blocks delete)
  const { count: bookingCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", staffId);

  if (bookingCount && bookingCount > 0) {
    return { error: "This staff member has bookings on record. Deactivate them instead." };
  }

  // Also check reviews
  const { count: reviewCount } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", staffId);

  if (reviewCount && reviewCount > 0) {
    return { error: "This staff member has reviews on record. Deactivate them instead." };
  }

  // Safe to delete — staff_services, staff_schedules, schedule_exceptions cascade
  const { error } = await admin
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("business_id", business.id);

  if (error) {
    return { error: `Could not delete: ${error.message}` };
  }

  redirect("/dashboard/business/staff");
}
