"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { weeklySlotSchema, scheduleExceptionSchema } from "@/lib/validations/schedule";

export type ScheduleFormState = {
  error?: string;
  success?: boolean;
} | null;

async function getStaffId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return staffRow?.id ?? null;
}

/* ── Weekly schedule slots ── */

export async function addWeeklySlot(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const staffId = await getStaffId();
  if (!staffId) return { error: "Not authenticated as staff" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = weeklySlotSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { day_of_week, start_time, end_time } = parsed.data;

  // Check for existing slot on this day
  const { data: existing } = await supabase
    .from("staff_schedules")
    .select("id")
    .eq("staff_id", staffId)
    .eq("day_of_week", day_of_week)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("staff_schedules")
      .update({ start_time: `${start_time}:00`, end_time: `${end_time}:00` })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("staff_schedules").insert({
      staff_id: staffId,
      day_of_week,
      start_time: `${start_time}:00`,
      end_time: `${end_time}:00`,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/staff/schedule");
  return { success: true };
}

export async function removeWeeklySlot(formData: FormData) {
  const staffId = await getStaffId();
  if (!staffId) return;

  const slotId = formData.get("slot_id") as string;
  if (!slotId) return;

  const supabase = await createClient();
  await supabase
    .from("staff_schedules")
    .delete()
    .eq("id", slotId)
    .eq("staff_id", staffId);

  revalidatePath("/dashboard/staff/schedule");
}

/* ── Schedule exceptions (time off / blocks) ── */

export async function addException(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const staffId = await getStaffId();
  if (!staffId) return { error: "Not authenticated as staff" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = scheduleExceptionSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { starts_at, ends_at, reason, is_available } = parsed.data;

  const { error } = await supabase.from("schedule_exceptions").insert({
    staff_id: staffId,
    starts_at: new Date(starts_at).toISOString(),
    ends_at: new Date(ends_at).toISOString(),
    reason: reason || null,
    is_available,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff/schedule");
  return { success: true };
}

export async function removeException(formData: FormData) {
  const staffId = await getStaffId();
  if (!staffId) return;

  const exceptionId = formData.get("exception_id") as string;
  if (!exceptionId) return;

  const supabase = await createClient();
  await supabase
    .from("schedule_exceptions")
    .delete()
    .eq("id", exceptionId)
    .eq("staff_id", staffId);

  revalidatePath("/dashboard/staff/schedule");
}

/* ── Business owner managing staff schedule ── */

export async function addWeeklySlotForStaff(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
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

  const staffId = formData.get("staff_id") as string;
  if (!staffId) return { error: "Missing staff_id" };

  // Verify staff belongs to this business
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!staff) return { error: "Staff not found" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = weeklySlotSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const { day_of_week, start_time, end_time } = parsed.data;

  const { data: existing } = await supabase
    .from("staff_schedules")
    .select("id")
    .eq("staff_id", staffId)
    .eq("day_of_week", day_of_week)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("staff_schedules")
      .update({ start_time: `${start_time}:00`, end_time: `${end_time}:00` })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("staff_schedules").insert({
      staff_id: staffId,
      day_of_week,
      start_time: `${start_time}:00`,
      end_time: `${end_time}:00`,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/business/staff/${staffId}`);
  return { success: true };
}

export async function removeWeeklySlotForStaff(formData: FormData) {
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

  const slotId = formData.get("slot_id") as string;
  const staffId = formData.get("staff_id") as string;
  if (!slotId || !staffId) return;

  // Verify ownership
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!staff) return;

  await supabase
    .from("staff_schedules")
    .delete()
    .eq("id", slotId)
    .eq("staff_id", staffId);

  revalidatePath(`/dashboard/business/staff/${staffId}`);
}
