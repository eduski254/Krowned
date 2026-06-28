import { emailLayout, emailButton, emailDetailRow } from "./layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zawadi.com";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function bookingRef(bookingId: string): string {
  return "ZW-" + bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function bookingDetailsTable(details: {
  ref: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  staff: string;
  business: string;
  amount?: string;
}): string {
  let rows = "";
  rows += emailDetailRow("Reference", `<strong>${details.ref}</strong>`);
  rows += emailDetailRow("Service", details.service);
  rows += emailDetailRow("Business", details.business);
  rows += emailDetailRow("Date", details.date);
  rows += emailDetailRow("Time", details.time);
  rows += emailDetailRow("Duration", `${details.duration} min`);
  rows += emailDetailRow("Professional", details.staff);
  if (details.amount) rows += emailDetailRow("Total", details.amount);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e8e8ed;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:16px;">${rows}</td></tr>
  </table>`;
}

// ── 1. Welcome ──────────────────────────────────────────────────────

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Zawadi!",
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">Welcome, ${name}!</h2>
      <p>We're glad you're here. Zawadi connects you with the best beauty and wellness professionals near you.</p>
      <p>Browse services, book your first appointment, and discover something new.</p>
      ${emailButton("Explore Services", `${SITE_URL}/explore`)}
      <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>`,
      `Welcome to Zawadi, ${name}!`,
    ),
  };
}

// ── 2. Booking Confirmation (to client) ─────────────────────────────

export function bookingConfirmationEmail(data: {
  clientName: string;
  bookingId: string;
  serviceName: string;
  businessName: string;
  staffName: string;
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
  amount?: number;
  currency?: string;
}): { subject: string; html: string } {
  const ref = bookingRef(data.bookingId);
  const amountStr =
    data.amount != null
      ? `${(data.amount / 100).toFixed(2)} ${data.currency?.toUpperCase() ?? ""}`
      : undefined;

  return {
    subject: `Booking confirmed — ${ref}`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">You're all set, ${data.clientName}!</h2>
      <p>Your booking has been confirmed. Here are the details:</p>
      ${bookingDetailsTable({
        ref,
        service: data.serviceName,
        business: data.businessName,
        date: formatDate(data.startsAt),
        time: formatTime(data.startsAt, data.timezone),
        duration: data.durationMinutes,
        staff: data.staffName,
        amount: amountStr,
      })}
      <p style="font-size:13px;color:#6b7280;">A calendar invite (.ics) is attached to this email. Add it to your calendar so you don't miss it!</p>
      ${emailButton("View My Bookings", `${SITE_URL}/dashboard/bookings`)}`,
      `Booking confirmed: ${data.serviceName} at ${data.businessName}`,
    ),
  };
}

// ── 3. Booking Reschedule (to client) ───────────────────────────────

export function bookingRescheduleEmail(data: {
  clientName: string;
  bookingId: string;
  serviceName: string;
  businessName: string;
  staffName: string;
  oldStartsAt: Date;
  newStartsAt: Date;
  durationMinutes: number;
  timezone: string;
}): { subject: string; html: string } {
  const ref = bookingRef(data.bookingId);

  return {
    subject: `Booking rescheduled — ${ref}`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">Booking rescheduled</h2>
      <p>Hi ${data.clientName}, your booking has been moved to a new time.</p>
      <p style="margin:12px 0;padding:12px;background:#fef3c7;border-radius:8px;font-size:14px;">
        <strong>Was:</strong> ${formatDate(data.oldStartsAt)} at ${formatTime(data.oldStartsAt, data.timezone)}<br/>
        <strong>Now:</strong> ${formatDate(data.newStartsAt)} at ${formatTime(data.newStartsAt, data.timezone)}
      </p>
      ${bookingDetailsTable({
        ref,
        service: data.serviceName,
        business: data.businessName,
        date: formatDate(data.newStartsAt),
        time: formatTime(data.newStartsAt, data.timezone),
        duration: data.durationMinutes,
        staff: data.staffName,
      })}
      <p style="font-size:13px;color:#6b7280;">An updated calendar invite is attached.</p>
      ${emailButton("View My Bookings", `${SITE_URL}/dashboard/bookings`)}`,
      `Your booking at ${data.businessName} has been rescheduled`,
    ),
  };
}

// ── 4. Booking Cancellation (to client) ─────────────────────────────

export function bookingCancellationEmail(data: {
  clientName: string;
  bookingId: string;
  serviceName: string;
  businessName: string;
  startsAt: Date;
  timezone: string;
  cancelledBy: "client" | "business";
}): { subject: string; html: string } {
  const ref = bookingRef(data.bookingId);
  const who =
    data.cancelledBy === "client"
      ? "You cancelled"
      : `${data.businessName} cancelled`;

  return {
    subject: `Booking cancelled — ${ref}`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">Booking cancelled</h2>
      <p>Hi ${data.clientName}, ${who.toLowerCase()} your booking.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e8e8ed;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:16px;">
          ${emailDetailRow("Reference", `<strong>${ref}</strong>`)}
          ${emailDetailRow("Service", data.serviceName)}
          ${emailDetailRow("Was scheduled", `${formatDate(data.startsAt)} at ${formatTime(data.startsAt, data.timezone)}`)}
        </td></tr>
      </table>
      <p>Want to rebook?</p>
      ${emailButton("Browse Services", `${SITE_URL}/explore`)}`,
      `Your booking at ${data.businessName} has been cancelled`,
    ),
  };
}

// ── 5. New Booking (to business owner) ──────────────────────────────

export function newBookingOwnerEmail(data: {
  ownerName: string;
  clientName: string;
  bookingId: string;
  serviceName: string;
  businessName: string;
  staffName: string;
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
  amount?: number;
  currency?: string;
}): { subject: string; html: string } {
  const ref = bookingRef(data.bookingId);
  const amountStr =
    data.amount != null
      ? `${(data.amount / 100).toFixed(2)} ${data.currency?.toUpperCase() ?? ""}`
      : undefined;

  return {
    subject: `New booking from ${data.clientName} — ${ref}`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">New booking!</h2>
      <p>Hi ${data.ownerName}, ${data.clientName} just booked an appointment.</p>
      ${bookingDetailsTable({
        ref,
        service: data.serviceName,
        business: data.businessName,
        date: formatDate(data.startsAt),
        time: formatTime(data.startsAt, data.timezone),
        duration: data.durationMinutes,
        staff: data.staffName,
        amount: amountStr,
      })}
      ${emailButton("View Calendar", `${SITE_URL}/dashboard/business/calendar`)}`,
      `${data.clientName} booked ${data.serviceName}`,
    ),
  };
}

// ── 6. Booking Cancelled by Client (to business owner) ──────────────

export function bookingCancelledByClientOwnerEmail(data: {
  ownerName: string;
  clientName: string;
  bookingId: string;
  serviceName: string;
  startsAt: Date;
  timezone: string;
}): { subject: string; html: string } {
  const ref = bookingRef(data.bookingId);

  return {
    subject: `Booking cancelled by ${data.clientName} — ${ref}`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">Booking cancelled</h2>
      <p>Hi ${data.ownerName}, ${data.clientName} cancelled their booking.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e8e8ed;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:16px;">
          ${emailDetailRow("Reference", `<strong>${ref}</strong>`)}
          ${emailDetailRow("Service", data.serviceName)}
          ${emailDetailRow("Was scheduled", `${formatDate(data.startsAt)} at ${formatTime(data.startsAt, data.timezone)}`)}
        </td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">The time slot is now free for other clients.</p>
      ${emailButton("View Calendar", `${SITE_URL}/dashboard/business/calendar`)}`,
      `${data.clientName} cancelled their booking for ${data.serviceName}`,
    ),
  };
}

// ── 7. New Review (to business owner) ───────────────────────────────

export function newReviewOwnerEmail(data: {
  ownerName: string;
  clientName: string;
  rating: number;
  comment?: string;
  serviceName: string;
  businessName: string;
}): { subject: string; html: string } {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

  return {
    subject: `New ${data.rating}-star review from ${data.clientName}`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">New review!</h2>
      <p>Hi ${data.ownerName}, ${data.clientName} left a review for ${data.serviceName}.</p>
      <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e8e8ed;">
        <p style="margin:0 0 8px;font-size:20px;letter-spacing:2px;color:#f59e0b;">${stars}</p>
        ${data.comment ? `<p style="margin:0;font-style:italic;color:#374151;">"${data.comment}"</p>` : ""}
        <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">— ${data.clientName}</p>
      </div>
      ${emailButton("View & Respond", `${SITE_URL}/dashboard/business/reviews`)}`,
      `${data.clientName} left a ${data.rating}-star review on ${data.businessName}`,
    ),
  };
}

// ── 8. Staff Invitation ─────────────────────────────────────────────

export function staffInvitationEmail(data: {
  staffName: string;
  businessName: string;
  inviteToken: string;
  invitedBy: string;
}): { subject: string; html: string } {
  const acceptUrl = `${SITE_URL}/invite/${data.inviteToken}`;

  return {
    subject: `You're invited to join ${data.businessName} on Zawadi`,
    html: emailLayout(
      `<h2 style="margin:0 0 16px;font-size:22px;">You're invited!</h2>
      <p>Hi ${data.staffName}, ${data.invitedBy} has invited you to join <strong>${data.businessName}</strong> on Zawadi as a team member.</p>
      <p>Click below to accept the invitation and set up your account. This link expires in 7 days.</p>
      ${emailButton("Accept Invitation", acceptUrl)}
      <p style="font-size:13px;color:#6b7280;">If you didn't expect this invite, you can safely ignore this email.</p>`,
      `Join ${data.businessName} on Zawadi`,
    ),
  };
}
