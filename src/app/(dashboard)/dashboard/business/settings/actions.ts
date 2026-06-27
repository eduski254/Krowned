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
