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
      `id, client_id, contact_id, staff_id, starts_at, ends_at, status, service_amount, currency,
       services(name, duration_minutes),
       staff(display_name, user_id, invited_email),
       businesses(name, timezone, owner_id, address, city),
       profiles!client_id(full_name),
       business_contacts!contact_id(name, email)`,
    )
    .eq("id", bookingId)
    .single();

  if (!data) return null;

  // Resolve client email + name from either auth user or business contact
  let clientEmail: string | undefined;
  let clientName = "there";

  const clientId = data.client_id;
  const contactId = data.contact_id;

  if (clientId) {
    const {
      data: { user: clientUser },
    } = await admin.auth.admin.getUserById(clientId);
    clientEmail = clientUser?.email;
    clientName = (data.profiles as any)?.full_name ?? "there";
  } else if (contactId) {
    const contact = data.business_contacts as any;
    clientEmail = contact?.email ?? undefined;
    clientName = contact?.name ?? "there";
  }

  if (!clientEmail) return null;

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
    clientEmail,
    clientName,
    clientId,
    serviceName: (data.services as any)?.name ?? "Service",
    durationMinutes: (data.services as any)?.duration_minutes ?? 60,
    staffName: staffData?.display_name ?? "Your professional",
    businessName: (data.businesses as any)?.name ?? "Business",
    timezone: (data.businesses as any)?.timezone ?? "UTC",
    address: [
      (data.businesses as any)?.address,
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
 * Send booking confirmation email to a manually-added contact (no auth account).
 * Only sends if the contact has an email address.
 */
export async function sendManualBookingConfirmationEmail({
  bookingId,
  contactId,
}: {
  bookingId: string;
  contactId: string;
}) {
  const admin = createAdminClient();

  // Fetch the contact's email
  const { data: contact } = await admin
    .from("business_contacts")
    .select("name, email")
    .eq("id", contactId)
    .single();

  if (!contact?.email) return; // No email — nothing to send

  // Fetch booking details
  const { data } = await admin
    .from("bookings")
    .select(
      `id, starts_at, ends_at, service_amount, currency,
       services(name, duration_minutes),
       staff(display_name),
       businesses(name, timezone, address, city, owner_id)`,
    )
    .eq("id", bookingId)
    .single();

  if (!data) return;

  const serviceName = (data.services as any)?.name ?? "Service";
  const durationMinutes = (data.services as any)?.duration_minutes ?? 60;
  const staffName = (data.staff as any)?.display_name ?? "Your professional";
  const businessName = (data.businesses as any)?.name ?? "Business";
  const timezone = (data.businesses as any)?.timezone ?? "UTC";
  const address = [(data.businesses as any)?.address, (data.businesses as any)?.city]
    .filter(Boolean)
    .join(", ");

  // Generate .ics
  const icsContent = generateICSString({
    title: `${serviceName} at ${businessName}`,
    start: new Date(data.starts_at),
    end: new Date(data.ends_at),
    timezone,
    location: address || undefined,
    description: `Booking ref: ZW-${bookingId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
  });

  // Build and send the confirmation email
  const mail = bookingConfirmationEmail({
    clientName: contact.name,
    bookingId,
    serviceName,
    businessName,
    staffName,
    startsAt: new Date(data.starts_at),
    durationMinutes,
    timezone,
    amount: data.service_amount ?? undefined,
    currency: data.currency ?? undefined,
  });

  await sendEmail({
    to: contact.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: [{ filename: "booking.ics", content: icsContent }],
  });

  // Also email the owner
  const ownerId = (data.businesses as any)?.owner_id;
  if (ownerId) {
    const { data: { user: ownerUser } } = await admin.auth.admin.getUserById(ownerId);
    if (ownerUser?.email) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", ownerId)
        .single();

      const ownerMail = newBookingOwnerEmail({
        ownerName: ownerProfile?.full_name ?? "there",
        clientName: contact.name,
        bookingId,
        serviceName,
        businessName,
        staffName,
        startsAt: new Date(data.starts_at),
        durationMinutes,
        timezone,
        amount: data.service_amount ?? undefined,
        currency: data.currency ?? undefined,
      });

      await sendEmail({
        to: ownerUser.email,
        subject: ownerMail.subject,
        html: ownerMail.html,
        text: ownerMail.text,
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
    text: mail.text,
    attachments: [{ filename: "booking-updated.ics", content: icsContent }],
  });
}
