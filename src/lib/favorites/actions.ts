"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  businessId: z.string().uuid(),
});

export async function toggleFavorite(businessId: string) {
  const parsed = schema.safeParse({ businessId });
  if (!parsed.success) {
    return { error: "Invalid business ID" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "not_authenticated" };
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("client_id", user.id)
    .eq("business_id", parsed.data.businessId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return { favorited: false };
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ client_id: user.id, business_id: parsed.data.businessId });
    if (error) return { error: error.message };
    return { favorited: true };
  }
}
