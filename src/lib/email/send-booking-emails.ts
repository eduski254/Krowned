import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./resend";
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
 * Resolves client, owner, and staff emails.
 */
async function fetchBookingDetails(bookingId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select(
      `id, client_id, staff_id, starts_at, ends_at, status, service_amount, currency,
       services(name, duration_minutes),
       staff(display_name, user_id, invited_email),
       businesses(name, timezone, owner_id, address_line1, city),
       profiles!client_id(full_name)`,
    )
    .eq("id", bookingId)
    .single();

  if (!data) return null;

  const clientId = data.client_id;
  if (!clientId) return null;

  const {
    data: { user: clientUser },
  } = await admin.auth.admin.getUserById(clientId);
  if (!clientUser) return null;

  // Fetch owner profile + email
  const ownerId = (data.businesses as any)?.owner_id;
  let ownerEmail: string | undefined;
  let ownerName: string | undefined;
  if (ownerId) {
    const [
      {
        data: { user: ownerUser },
      },
      { data: ownerProfile },
    ] = await Promise.all([
      admin.auth.admin.getUserById(ownerId),
      admin.from("profiles").select("full_name").eq("id", ownerId).single(),
    ]);
    ownerEmail = ownerUser?.email;
    ownerName = ownerProfile?.full_name ?? "there";
  }

  // Resolve staff member's email (if assigned and not the owner)
  let staffEmail: string | undefined;
  const staffData = data.staff as any;
  if (staffData) {
    if (staffData.user_id && staffData.user_id !== ownerId) {
      const {
        data: { user: staffUser },
      } = await admin.auth.admin.getUserById(staffData.user_id);
      staffEmail = staffUser?.email;
    } else if (!staffData.user_id && staffData.invited_email) {
      // Staff hasn't accepted invite yet — use invited_email
      staffEmail = staffData.invited_email;
    }
  }

  return {
    booking: data,
    clientEmail: clientUser.email!,
    clientName: (data.profiles as any)?.full_name ?? "there",
    clientId,
    serviceName: (data.services as any)?.name ?? "Service",
    durationMinutes: (data.services as any)?.duration_minutes ?? 60,
    staffName: staffData?.display_name ?? "Your professional",
    businessName: (data.businesses as any)?.name ?? "Business",
    timezone: (data.businesses as any)?.timezone ?? "UTC",
    address: [
      (data.businesses as any)?.address_line1,
      (data.businesses as any)?.city,
    ]
      .filter(Boolean)
      .join(", "),
    ownerId,
    ownerEmail,
    ownerName: ownerName ?? "there",
    staffEmail,
    serviceAmount: data.service_amount,
    currency: data.currency,
    startsAt: new Date(data.starts_at),
    endsAt: new Date(data.ends_at),
  };
}

/**
 * Send booking confirmation email to client + new booking email to owner + staff.
 * Includes .ics calendar attachment for client.
 */
export async function sendBookingConfirmationEmails({
  bookingId,
}: BookingEmailData) {
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

  // 1. Email to client (essential)
  const clientMail = bookingConfirmationEmail({
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
    subject: clientMail.subject,
    html: clientMail.html,
    text: clientMail.text,
    attachments: [{ filename: "booking.ics", content: icsContent }],
  });

  // Shared owner/staff email content
  const ownerMailData = {
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
  };

  // 2. Email to business owner (essential)
  if (details.ownerEmail) {
    const ownerMail = newBookingOwnerEmail({
      ownerName: details.ownerName,
      ...ownerMailData,
    });
    await sendEmail({
      to: details.ownerEmail,
      subject: ownerMail.subject,
      html: ownerMail.html,
      text: ownerMail.text,
    });
  }

  // 3. Email to assigned staff (if different from owner)
  if (details.staffEmail) {
    const staffMail = newBookingOwnerEmail({
      ownerName: details.staffName,
      ...ownerMailData,
    });
    await sendEmail({
      to: details.staffEmail,
      subject: staffMail.subject,
      html: staffMail.html,
      text: staffMail.text,
    });
  }
}

/**
 * Send booking cancellation email to client + notification to owner + staff.
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
    text: clientMail.text,
  });

  const cancelOwnerData = {
    clientName: details.clientName,
    bookingId,
    serviceName: details.serviceName,
    startsAt: details.startsAt,
    timezone: details.timezone,
  };

  // 2. Email to owner if cancelled by client (essential)
  if (cancelledBy === "client" && details.ownerEmail) {
    const ownerMail = bookingCancelledByClientOwnerEmail({
      ownerName: details.ownerName,
      ...cancelOwnerData,
    });
    await sendEmail({
      to: details.ownerEmail,
      subject: ownerMail.subject,
      html: ownerMail.html,
      text: ownerMail.text,
    });
  }

  // 3. Email to assigned staff if cancelled by client (so they know slot is free)
  if (cancelledBy === "client" && details.staffEmail) {
    const staffMail = bookingCancelledByClientOwnerEmail({
      ownerName: details.staffName,
      ...cancelOwnerData,
    });
    await sendEmail({
      to: details.staffEmail,
      subject: staffMail.subject,
      html: staffMail.html,
      text: staffMail.text,
    });
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
    text: mail.text,
    attachments: [{ filename: "booking-updated.ics", content: icsContent }],
  });
}
