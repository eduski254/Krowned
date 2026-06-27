"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const responseSchema = z.object({
  reviewId: z.string().uuid(),
  body: z.string().min(1, "Response cannot be empty").max(2000),
});

export async function upsertReviewResponse(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = responseSchema.safeParse({
    reviewId: formData.get("reviewId"),
    body: (formData.get("body") as string)?.trim(),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Verify this review belongs to the owner's business
  const { data: review } = await supabase
    .from("reviews")
    .select("id, business_id, businesses!inner(owner_id)")
    .eq("id", parsed.data.reviewId)
    .maybeSingle();

  if (!review) return { error: "Review not found" };

  const ownerData = review.businesses as unknown as { owner_id: string };
  if (ownerData.owner_id !== user.id) {
    return { error: "You can only respond to reviews for your business" };
  }

  // Check if a response already exists
  const { data: existing } = await supabase
    .from("review_responses")
    .select("id")
    .eq("review_id", parsed.data.reviewId)
    .maybeSingle();

  if (existing) {
    // Update existing response
    const { error } = await supabase
      .from("review_responses")
      .update({ body: parsed.data.body })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    // Insert new response
    const { error } = await supabase.from("review_responses").insert({
      review_id: parsed.data.reviewId,
      responder_id: user.id,
      body: parsed.data.body,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/business/reviews/${parsed.data.reviewId}`);
  revalidatePath("/dashboard/business/reviews");
  return { success: true };
}
