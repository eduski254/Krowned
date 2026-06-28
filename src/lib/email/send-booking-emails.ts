import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./resend";
import { shouldSendEmail } from "./preferences";
import { generateICSString } from "./ics";
import {
  bookingConfirmationEmail,
  bookingCancellationEmail,
  bookingRescheduleEmail,
  newBookingOwnerEmail,
  bookingCancelledByClientOwnerEmail,
} from "./templates";

interface BookingEmailData {
  bookingId: string;
}

/**
 * Fetch full booking details needed for email templates.
 * Returns null if booking not found.
 */
async function fetchBookingDetails(bookingId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select(
      `id, client_id, starts_at, ends_at, status, service_amount, currency,
       services(name, duration_minutes),
       staff(display_name),
       businesses(name, timezone, owner_id, address_line1, city),
       profiles!client_id(full_name)`,
    )
    .eq("id", bookingId)
    .single();

  if (!data) return null;

  const clientId = data.client_id;
  if (!clientId) return null;

  const { data: { user: clientUser } } = await admin.auth.admin.getUserById(clientId);
  if (!clientUser) return null;

  // Fetch owner profile + email
  const ownerId = (data.businesses as any)?.owner_id;
  let ownerEmail: string | undefined;
  let ownerName: string | undefined;
  if (ownerId) {
    const [{ data: { user: ownerUser } }, { data: ownerProfile }] = await Promise.all([
      admin.auth.admin.getUserById(ownerId),
      admin.from("profiles").select("full_name").eq("id", ownerId).single(),
    ]);
    ownerEmail = ownerUser?.email;
    ownerName = ownerProfile?.full_name ?? "there";
  }

  return {
    booking: data,
    clientEmail: clientUser.email!,
    clientName: (data.profiles as any)?.full_name ?? "there",
    clientId,
    serviceName: (data.services as any)?.name ?? "Service",
    durationMinutes: (data.services as any)?.duration_minutes ?? 60,
    staffName: (data.staff as any)?.display_name ?? "Your professional",
    businessName: (data.businesses as any)?.name ?? "Business",
    timezone: (data.businesses as any)?.timezone ?? "UTC",
    address: [(data.businesses as any)?.address_line1, (data.businesses as any)?.city]
      .filter(Boolean)
      .join(", "),
    ownerId,
    ownerEmail,
    ownerName: ownerName ?? "there",
    serviceAmount: data.service_amount,
    currency: data.currency,
    startsAt: new Date(data.starts_at),
    endsAt: new Date(data.ends_at),
  };
}

/**
 * Send booking confirmation email to client + new booking email to owner.
 * Includes .ics calendar attachment.
 */
export async function sendBookingConfirmationEmails({ bookingId }: BookingEmailData) {
  const details = await fetchBookingDetails(bookingId);
  if (!details) return;

  // Generate .ics attachment
  const icsContent = generateICSString({
    title: `${details.serviceName} at ${details.businessName}`,
    start: details.startsAt,
    end: details.endsAt,
    timezone: details.timezone,
    location: details.address || undefined,
    description: `Booking ref: ZW-${bookingId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
  });

  // 1. Email to client (essential — always sent)
  const clientEmail = bookingConfirmationEmail({
    clientName: details.clientName,
    bookingId,
    serviceName: details.serviceName,
    businessName: details.businessName,
    staffName: details.staffName,
    startsAt: details.startsAt,
    durationMinutes: details.durationMinutes,
    timezone: details.timezone,
    amount: details.serviceAmount ?? undefined,
    currency: details.currency ?? undefined,
  });

  await sendEmail({
    to: details.clientEmail,
    subject: clientEmail.subject,
    html: clientEmail.html,
    attachments: [{ filename: "booking.ics", content: icsContent }],
  });

  // 2. Email to business owner (optional — respect preferences)
  if (details.ownerEmail && details.ownerId) {
    const shouldSend = await shouldSendEmail(details.ownerId, "new_booking_owner");
    if (shouldSend) {
      const ownerMail = newBookingOwnerEmail({
        ownerName: details.ownerName,
        clientName: details.clientName,
        bookingId,
        serviceName: details.serviceName,
        businessName: details.businessName,
        staffName: details.staffName,
        startsAt: details.startsAt,
        durationMinutes: details.durationMinutes,
        timezone: details.timezone,
        amount: details.serviceAmount ?? undefined,
        currency: details.currency ?? undefined,
      });

      await sendEmail({
        to: details.ownerEmail,
        subject: ownerMail.subject,
        html: ownerMail.html,
      });
    }
  }
}

/**
 * Send booking cancellation email to client + notification to owner.
 */
export async function sendBookingCancellationEmails({
  bookingId,
  cancelledBy,
}: BookingEmailData & { cancelledBy: "client" | "business" }) {
  const details = await fetchBookingDetails(bookingId);
  if (!details) return;

  // 1. Email to client (essential)
  const clientMail = bookingCancellationEmail({
    clientName: details.clientName,
    bookingId,
    serviceName: details.serviceName,
    businessName: details.businessName,
    startsAt: details.startsAt,
    timezone: details.timezone,
    cancelledBy,
  });

  await sendEmail({
    to: details.clientEmail,
    subject: clientMail.subject,
    html: clientMail.html,
  });

  // 2. Email to owner if cancelled by client (optional)
  if (cancelledBy === "client" && details.ownerEmail && details.ownerId) {
    const shouldSend = await shouldSendEmail(details.ownerId, "booking_cancelled_owner");
    if (shouldSend) {
      const ownerMail = bookingCancelledByClientOwnerEmail({
        ownerName: details.ownerName,
        clientName: details.clientName,
        bookingId,
        serviceName: details.serviceName,
        startsAt: details.startsAt,
        timezone: details.timezone,
      });

      await sendEmail({
        to: details.ownerEmail,
        subject: ownerMail.subject,
        html: ownerMail.html,
      });
    }
  }
}

/**
 * Send booking reschedule email to client with updated .ics.
 */
export async function sendBookingRescheduleEmail({
  bookingId,
  oldStartsAt,
}: BookingEmailData & { oldStartsAt: Date }) {
  const details = await fetchBookingDetails(bookingId);
  if (!details) return;

  const icsContent = generateICSString({
    title: `${details.serviceName} at ${details.businessName}`,
    start: details.startsAt,
    end: details.endsAt,
    timezone: details.timezone,
    location: details.address || undefined,
    description: `Booking ref: ZW-${bookingId.replace(/-/g, "").slice(0, 8).toUpperCase()} (rescheduled)`,
  });

  const mail = bookingRescheduleEmail({
    clientName: details.clientName,
    bookingId,
    serviceName: details.serviceName,
    businessName: details.businessName,
    staffName: details.staffName,
    oldStartsAt,
    newStartsAt: details.startsAt,
    durationMinutes: details.durationMinutes,
    timezone: details.timezone,
  });

  await sendEmail({
    to: details.clientEmail,
    subject: mail.subject,
    html: mail.html,
    attachments: [{ filename: "booking-updated.ics", content: icsContent }],
  });
}
