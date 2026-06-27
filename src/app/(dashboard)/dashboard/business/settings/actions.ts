"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const toggleVisibilitySchema = z.object({
  businessId: z.string().uuid(),
  isPublished: z.boolean(),
});

export async function toggleVisibility(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = toggleVisibilitySchema.safeParse({
    businessId: formData.get("businessId"),
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parsed.success) return { error: "Invalid input" };

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", parsed.data.businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return { error: "Business not found" };

  const { error } = await supabase
    .from("businesses")
    .update({ is_published: parsed.data.isPublished })
    .eq("id", parsed.data.businessId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/business/settings");
  revalidatePath("/explore");
  return { success: true };
}

// --- Business Hours ---

const dayHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_closed: z.boolean(),
});

const saveHoursSchema = z.object({
  businessId: z.string().uuid(),
  hours: z.array(dayHoursSchema).length(7),
});

export async function saveBusinessHours(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  let hoursRaw: unknown;
  try {
    hoursRaw = JSON.parse(formData.get("hours") as string);
  } catch {
    return { error: "Invalid hours data" };
  }

  const parsed = saveHoursSchema.safeParse({
    businessId: formData.get("businessId"),
    hours: hoursRaw,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Validate close > open for non-closed days
  for (const day of parsed.data.hours) {
    if (!day.is_closed && day.close_time <= day.open_time) {
      return { error: `Closing time must be after opening time.` };
    }
  }

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", parsed.data.businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return { error: "Business not found" };

  // Delete existing hours and re-insert
  await supabase
    .from("business_hours")
    .delete()
    .eq("business_id", business.id);

  const openDays = parsed.data.hours.filter((d) => !d.is_closed);

  if (openDays.length > 0) {
    const { error } = await supabase.from("business_hours").insert(
      openDays.map((d) => ({
        business_id: business.id,
        day_of_week: d.day_of_week,
        open_time: d.open_time,
        close_time: d.close_time,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/business/settings");
  return { success: true };
}
