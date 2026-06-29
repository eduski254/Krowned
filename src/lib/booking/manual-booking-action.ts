"use server";

/**
 * Server action: create a manual booking on behalf of a client contact.
 * Used by business owners/staff taking phone/walk-in bookings.
 *
 * Key differences from the online holdBookingSlot:
 * - No client auth required (the OWNER/STAFF is authenticated)
 * - Creates/reuses a business_contact record
 * - Warns on conflicts but allows override (no hard block)
 * - Always pay_at_store, source='manual'
 * - Skips lead-time and 60-day window checks (staff can book same-day)
 * - Sends confirmation email if contact has email
 */

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendManualBookingConfirmationEmail } from "@/lib/email/send-booking-emails";

const manualBookingSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  /** UTC ISO string */
  slotStart: z.string().datetime(),
  /** Contact info — either existing or new */
  contact: z.union([
    z.object({ type: z.literal("existing"), contactId: z.string().uuid() }),
    z.object({
      type: z.literal("new"),
      name: z.string().min(1, "Name is required").trim(),
      phone: z.string().trim().optional(),
      email: z.string().email().trim().optional(),
    }).refine((c) => c.phone || c.email, {
      message: "At least one of phone or email is required",
    }),
  ]),
  /** If true, override conflict warning and book anyway */
  overrideConflict: z.boolean().default(false),
  clientNote: z.string().max(500).trim().optional().default(""),
});

export type ManualBookingInput = z.infer<typeof manualBookingSchema>;

export interface ManualBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
  /** If there's a conflict but overrideable */
  conflict?: {
    staffName: string;
    existingBookingTime: string;
    message: string;
  };
}

export async function createManualBooking(
  input: ManualBookingInput,
): Promise<ManualBookingResult> {
  // 1. Validate
  const parsed = manualBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // 2. Authenticate the caller (must be owner or active staff of this business)
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();

  // 3. Verify caller is owner or active staff
  const [bizResult, staffResult] = await Promise.all([
    admin
      .from("businesses")
      .select("id, timezone, commission_rate, owner_id")
      .eq("id", data.businessId)
      .single(),
    admin
      .from("staff")
      .select("id")
      .eq("business_id", data.businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (bizResult.error || !bizResult.data) {
    return { success: false, error: "Business not found." };
  }
  const biz = bizResult.data;

  const isOwner = biz.owner_id === user.id;
  const isStaff = !!staffResult.data;
  if (!isOwner && !isStaff) {
    return { success: false, error: "You don't have permission to create bookings for this business." };
  }

  // 4. Fetch service
  const { data: service, error: svcErr } = await admin
    .from("services")
    .select("id, duration_minutes, price_amount, currency, business_id")
    .eq("id", data.serviceId)
    .eq("is_active", true)
    .single();

  if (svcErr || !service) return { success: false, error: "Service not found or inactive." };
  if (service.business_id !== biz.id) return { success: false, error: "Service does not belong to this business." };

  // 5. Compute slot times
  const slotStartDate = new Date(data.slotStart);
  const slotEndDate = new Date(slotStartDate.getTime() + service.duration_minutes * 60_000);

  // 6. Check for conflicts (warn, don't block unless not overridden)
  const { data: conflicts } = await admin
    .from("bookings")
    .select("id, starts_at, ends_at, staff(display_name)")
    .eq("staff_id", data.staffId)
    .not("status", "in", '("cancelled","no_show")')
    .lt("starts_at", slotEndDate.toISOString())
    .gt("ends_at", slotStartDate.toISOString());

  // Filter out expired holds
  const activeConflicts = (conflicts ?? []).filter((b) => {
    if ((b as any).status === "pending_hold" && (b as any).hold_expires_at) {
      return new Date((b as any).hold_expires_at) > new Date();
    }
    return true;
  });

  if (activeConflicts.length > 0 && !data.overrideConflict) {
    const conflict = activeConflicts[0];
    const staffName = (conflict.staff as any)?.display_name ?? "Staff member";
    const time = new Date(conflict.starts_at).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return {
      success: false,
      conflict: {
        staffName,
        existingBookingTime: time,
        message: `${staffName} already has a booking at ${time}. Override?`,
      },
    };
  }

  // 7. Resolve or create contact
  let contactId: string;

  if (data.contact.type === "existing") {
    // Verify it belongs to this business
    const { data: existing } = await admin
      .from("business_contacts")
      .select("id")
      .eq("id", data.contact.contactId)
      .eq("business_id", biz.id)
      .single();
    if (!existing) return { success: false, error: "Contact not found." };
    contactId = existing.id;
  } else {
    // Check for existing contact with same phone/email to avoid duplicates
    let existingContact = null;
    if (data.contact.email) {
      const { data: byEmail } = await admin
        .from("business_contacts")
        .select("id")
        .eq("business_id", biz.id)
        .ilike("email", data.contact.email)
        .maybeSingle();
      existingContact = byEmail;
    }
    if (!existingContact && data.contact.phone) {
      const { data: byPhone } = await admin
        .from("business_contacts")
        .select("id")
        .eq("business_id", biz.id)
        .eq("phone", data.contact.phone)
        .maybeSingle();
      existingContact = byPhone;
    }

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact, error: contactErr } = await admin
        .from("business_contacts")
        .insert({
          business_id: biz.id,
          name: data.contact.name,
          phone: data.contact.phone || null,
          email: data.contact.email || null,
        })
        .select("id")
        .single();

      if (contactErr || !newContact) {
        return { success: false, error: "Failed to create client contact." };
      }
      contactId = newContact.id;
    }
  }

  // 8. Calculate fees
  const serviceAmount = service.price_amount;
  const platformFee = Math.round(serviceAmount * (biz.commission_rate as number));

  // 9. Insert booking via the atomic reserve function (still protects against
  //    two SIMULTANEOUS writes). For manual bookings with override, we bypass
  //    the SLOT_TAKEN error by inserting directly when override is true.
  if (data.overrideConflict) {
    // Direct insert — staff deliberately overrode the conflict
    const { data: booking, error: insertErr } = await admin
      .from("bookings")
      .insert({
        client_id: null as unknown as string, // no auth account
        contact_id: contactId,
        business_id: biz.id,
        service_id: service.id,
        staff_id: data.staffId,
        staff_chosen_by_client: true,
        source: "manual" as const,
        starts_at: slotStartDate.toISOString(),
        ends_at: slotEndDate.toISOString(),
        status: "confirmed" as const,
        payment_method: "pay_at_store" as const,
        service_amount: serviceAmount,
        tip_amount: 0,
        platform_fee_amount: platformFee,
        currency: service.currency,
        client_note: data.clientNote || null,
      })
      .select("id")
      .single();

    if (insertErr) {
      return { success: false, error: "Failed to create booking." };
    }

    // Fire-and-forget: send email if contact has email
    sendManualBookingConfirmationEmail({ bookingId: booking.id, contactId }).catch(() => {});
    return { success: true, bookingId: booking.id };
  }

  // No conflict — use the atomic reserve function then confirm immediately
  const { data: bookingId, error: reserveErr } = await admin.rpc(
    "reserve_booking_slot",
    {
      p_client_id: null,
      p_business_id: biz.id,
      p_service_id: service.id,
      p_staff_id: data.staffId,
      p_staff_chosen: true,
      p_source: "manual",
      p_starts_at: slotStartDate.toISOString(),
      p_ends_at: slotEndDate.toISOString(),
      p_payment_method: "pay_at_store",
      p_service_amount: serviceAmount,
      p_platform_fee: platformFee,
      p_currency: service.currency,
      p_client_note: data.clientNote || null,
      p_hold_minutes: 10,
      p_contact_id: contactId,
    },
  );

  if (reserveErr) {
    if (reserveErr.message?.includes("SLOT_TAKEN")) {
      return { success: false, error: "This time slot was just taken. Please choose another." };
    }
    return { success: false, error: "Booking failed. Please try again." };
  }

  // Immediately confirm (manual bookings are pay-at-store)
  const bId = bookingId as string;
  await admin
    .from("bookings")
    .update({ status: "confirmed", hold_expires_at: null })
    .eq("id", bId);

  // Fire-and-forget: send email if contact has email
  sendManualBookingConfirmationEmail({ bookingId: bId, contactId }).catch(() => {});

  return { success: true, bookingId: bId };
}
