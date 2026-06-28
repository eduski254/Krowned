"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const businessSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain letters, numbers, and dashes"),
  description: z.string().max(2000).trim().optional().default(""),
  primary_category_id: z.string().uuid().optional().or(z.literal("")),
  phone: z.string().max(20).trim().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).trim().optional().default(""),
  city: z.string().max(100).trim().optional().default(""),
  country: z.string().max(5).trim().optional().default(""),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  location_notes: z.string().max(500).trim().optional().default(""),
});

export type BusinessProfileState = {
  error?: string;
  success?: boolean;
} | null;

export async function upsertBusiness(
  _prev: BusinessProfileState,
  formData: FormData,
): Promise<BusinessProfileState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = businessSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const businessId = formData.get("business_id") as string | null;
  const { primary_category_id, email, latitude, longitude, location_notes, ...rest } = parsed.data;

  const payload: Record<string, unknown> = {
    ...rest,
    email: email || null,
    primary_category_id: primary_category_id || null,
    location_notes: location_notes || null,
    owner_id: user.id,
  };

  // Only update coordinates if we got valid numbers
  if (typeof latitude === "number" && typeof longitude === "number") {
    payload.latitude = latitude;
    payload.longitude = longitude;
  }

  if (businessId) {
    const { error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", businessId)
      .eq("owner_id", user.id);
    if (error) return { error: error.message };
  } else {
    // New business — get the Free plan ID
    const { data: freePlan } = await supabase
      .from("plans")
      .select("id")
      .eq("tier", "free")
      .single();

    const { error } = await supabase.from("businesses").insert({
      ...payload,
      plan_id: freePlan?.id,
      verification_status: "pending" as const,
      is_published: false,
      commission_rate: 0.05,
      booking_link_token: crypto.randomUUID(),
    });
    if (error) return { error: error.message };
  }

  return { success: true };
}
