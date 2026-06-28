"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { newReviewOwnerEmail } from "@/lib/email/templates";
import { shouldSendEmail } from "@/lib/email/preferences";

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).trim().optional().default(""),
});

export type SubmitReviewInput = z.infer<typeof reviewSchema>;

export async function submitReview(
  input: SubmitReviewInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();
  const { bookingId, rating, comment } = parsed.data;

  // Fetch the booking to get business/service/staff IDs
  const { data: booking } = await admin
    .from("bookings")
    .select("id, client_id, business_id, service_id, staff_id, status")
    .eq("id", bookingId)
    .single();

  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.client_id !== user.id) return { success: false, error: "Not your booking." };
  if (booking.status !== "completed") {
    return { success: false, error: "You can only review completed bookings." };
  }

  // Check for existing review
  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) return { success: false, error: "You already reviewed this booking." };

  // Insert the review
  const { error: insertErr } = await admin.from("reviews").insert({
    booking_id: bookingId,
    client_id: user.id,
    business_id: booking.business_id,
    service_id: booking.service_id,
    staff_id: booking.staff_id,
    rating,
    comment: comment || null,
  });

  if (insertErr) return { success: false, error: "Failed to submit review." };

  // Fire-and-forget: send review notification to business owner
  (async () => {
    try {
      const [{ data: biz }, { data: profile }, { data: service }] = await Promise.all([
        admin
          .from("businesses")
          .select("name, owner_id")
          .eq("id", booking.business_id)
          .single(),
        admin.from("profiles").select("full_name").eq("id", user.id).single(),
        admin.from("services").select("name").eq("id", booking.service_id).single(),
      ]);

      if (!biz?.owner_id) return;

      const shouldSend = await shouldSendEmail(biz.owner_id, "new_review_owner");
      if (!shouldSend) return;

      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", biz.owner_id)
        .single();

      const {
        data: { user: ownerUser },
      } = await admin.auth.admin.getUserById(biz.owner_id);
      if (!ownerUser?.email) return;

      const mail = newReviewOwnerEmail({
        ownerName: ownerProfile?.full_name ?? "there",
        clientName: profile?.full_name ?? "A client",
        rating,
        comment: comment || undefined,
        serviceName: service?.name ?? "a service",
        businessName: biz.name,
      });

      await sendEmail({ to: ownerUser.email, ...mail });
    } catch {
      // Swallow — email failure must not break the review
    }
  })();

  return { success: true };
}
