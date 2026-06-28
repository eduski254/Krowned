"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100).trim(),
  phone: z.string().max(20).trim().optional().default(""),
  country: z.string().max(5).trim().optional().default(""),
  bio: z.string().max(500).trim().optional().default(""),
});

export type ProfileState = {
  error?: string;
  success?: boolean;
} | null;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const raw = {
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    bio: formData.get("bio"),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      country: parsed.data.country || null,
      bio: parsed.data.bio || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true };
}
