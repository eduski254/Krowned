import { emailLayout, emailButton, emailDetailRow, htmlToPlaintext } from "./layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

interface EmailOutput {
  subject: string;
  html: string;
  text: string;
}

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
  return "KD-" + bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();
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
    <tr><td style="padding:16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        ${rows}
      </table>
    </td></tr>
  </table>`;
}

function build(subject: string, html: string): EmailOutput {
  return { subject, html, text: htmlToPlaintext(html) };
}

// ── 1. Welcome ──────────────────────────────────────────────────────

export function welcomeEmail(name: string): EmailOutput {
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">Welcome, ${name}!</h2>
    <p>We're glad you're here. Krowned connects you with the best beauty and wellness professionals near you.</p>
    <p>Browse services, book your first appointment, and discover something new.</p>
    ${emailButton("Explore Services", `${SITE_URL}/explore`)}
    <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>`,
    `Welcome to Krowned, ${name}!`,
  );
  return build("Welcome to Krowned!", html);
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
}): EmailOutput {
  const ref = bookingRef(data.bookingId);
  const amountStr =
    data.amount != null
      ? `${(data.amount / 100).toFixed(2)} ${data.currency?.toUpperCase() ?? ""}`
      : undefined;

  const subject = `Booking confirmed — ${ref}`;
  const html = emailLayout(
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
    <p style="font-size:13px;color:#6b7280;">A calendar invite (.ics) is attached. Add it to your calendar so you don't miss it!</p>
    ${emailButton("View My Bookings", `${SITE_URL}/dashboard/bookings`)}`,
    `Booking confirmed: ${data.serviceName} at ${data.businessName}`,
  );
  return build(subject, html);
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
}): EmailOutput {
  const ref = bookingRef(data.bookingId);

  const subject = `Booking rescheduled — ${ref}`;
  const html = emailLayout(
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
  );
  return build(subject, html);
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
}): EmailOutput {
  const ref = bookingRef(data.bookingId);
  const who =
    data.cancelledBy === "client"
      ? "You cancelled"
      : `${data.businessName} cancelled`;

  const subject = `Booking cancelled — ${ref}`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">Booking cancelled</h2>
    <p>Hi ${data.clientName}, ${who.toLowerCase()} your booking.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e8e8ed;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${emailDetailRow("Reference", `<strong>${ref}</strong>`)}
          ${emailDetailRow("Service", data.serviceName)}
          ${emailDetailRow("Was scheduled", `${formatDate(data.startsAt)} at ${formatTime(data.startsAt, data.timezone)}`)}
        </table>
      </td></tr>
    </table>
    <p>Want to rebook?</p>
    ${emailButton("Browse Services", `${SITE_URL}/explore`)}`,
    `Your booking at ${data.businessName} has been cancelled`,
  );
  return build(subject, html);
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
}): EmailOutput {
  const ref = bookingRef(data.bookingId);
  const amountStr =
    data.amount != null
      ? `${(data.amount / 100).toFixed(2)} ${data.currency?.toUpperCase() ?? ""}`
      : undefined;

  const subject = `New booking from ${data.clientName} — ${ref}`;
  const html = emailLayout(
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
  );
  return build(subject, html);
}

// ── 6. Booking Cancelled by Client (to business owner) ──────────────

export function bookingCancelledByClientOwnerEmail(data: {
  ownerName: string;
  clientName: string;
  bookingId: string;
  serviceName: string;
  startsAt: Date;
  timezone: string;
}): EmailOutput {
  const ref = bookingRef(data.bookingId);

  const subject = `Booking cancelled by ${data.clientName} — ${ref}`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">Booking cancelled</h2>
    <p>Hi ${data.ownerName}, ${data.clientName} cancelled their booking.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e8e8ed;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${emailDetailRow("Reference", `<strong>${ref}</strong>`)}
          ${emailDetailRow("Service", data.serviceName)}
          ${emailDetailRow("Was scheduled", `${formatDate(data.startsAt)} at ${formatTime(data.startsAt, data.timezone)}`)}
        </table>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#6b7280;">The time slot is now free for other clients.</p>
    ${emailButton("View Calendar", `${SITE_URL}/dashboard/business/calendar`)}`,
    `${data.clientName} cancelled their booking for ${data.serviceName}`,
  );
  return build(subject, html);
}

// ── 7. New Review (to business owner) — OPTIONAL email ──────────────

export function newReviewOwnerEmail(data: {
  ownerName: string;
  clientName: string;
  rating: number;
  comment?: string;
  serviceName: string;
  businessName: string;
}): EmailOutput {
  const stars = "\u2605".repeat(data.rating) + "\u2606".repeat(5 - data.rating);

  const subject = `New ${data.rating}-star review from ${data.clientName}`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">New review!</h2>
    <p>Hi ${data.ownerName}, ${data.clientName} left a review for ${data.serviceName}.</p>
    <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e8e8ed;">
      <p style="margin:0 0 8px;font-size:20px;letter-spacing:2px;color:#f59e0b;">${stars}</p>
      ${data.comment ? `<p style="margin:0;font-style:italic;color:#374151;">"${data.comment}"</p>` : ""}
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">&mdash; ${data.clientName}</p>
    </div>
    ${emailButton("View & Respond", `${SITE_URL}/dashboard/business/reviews`)}`,
    `${data.clientName} left a ${data.rating}-star review on ${data.businessName}`,
    { showManagePrefs: true },
  );
  return build(subject, html);
}

// ── 8. Staff Invitation ─────────────────────────────────────────────

export function staffInvitationEmail(data: {
  staffName: string;
  businessName: string;
  inviteToken: string;
  invitedBy: string;
}): EmailOutput {
  const acceptUrl = `${SITE_URL}/invite/${data.inviteToken}`;

  const subject = `You're invited to join ${data.businessName} on Krowned`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">You're invited!</h2>
    <p>Hi ${data.staffName}, ${data.invitedBy} has invited you to join <strong>${data.businessName}</strong> on Krowned as a team member.</p>
    <p>Click below to accept the invitation and set up your account. This link expires in 7 days.</p>
    ${emailButton("Accept Invitation", acceptUrl)}
    <p style="font-size:13px;color:#6b7280;">If you didn't expect this invite, you can safely ignore this email.</p>`,
    `Join ${data.businessName} on Krowned`,
  );
  return build(subject, html);
}

// ── 9. Support Ticket — New Ticket (to admins) ────────────────────

export function newSupportTicketEmail(data: {
  adminName: string;
  userName: string;
  subject: string;
  category: string;
  ticketId: string;
  message: string;
}): EmailOutput {
  const subject = `New support ticket: ${data.subject}`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">New support ticket</h2>
    <p>Hi ${data.adminName}, a new support ticket has been submitted.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        ${emailDetailRow("From", data.userName)}
      </tr>
      <tr>
        ${emailDetailRow("Category", data.category)}
      </tr>
      <tr>
        ${emailDetailRow("Subject", data.subject)}
      </tr>
    </table>
    <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e8e8ed;">
      <p style="margin:0;color:#374151;white-space:pre-wrap;">${data.message.slice(0, 500)}</p>
    </div>
    ${emailButton("View Ticket", `${SITE_URL}/dashboard/support/${data.ticketId}`)}`,
    `New ticket from ${data.userName}: ${data.subject}`,
  );
  return build(subject, html);
}

// ── 10. Support Ticket — Reply (to user or admin) ─────────────────

export function supportTicketReplyEmail(data: {
  recipientName: string;
  senderName: string;
  ticketSubject: string;
  ticketId: string;
  message: string;
  isStaffReply: boolean;
}): EmailOutput {
  const subject = `Reply on: ${data.ticketSubject}`;
  const label = data.isStaffReply ? "Support Team" : data.senderName;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">New reply on your ticket</h2>
    <p>Hi ${data.recipientName}, ${label} replied to your support ticket.</p>
    <p style="font-size:13px;color:#6b7280;margin:4px 0 12px;">Subject: <strong>${data.ticketSubject}</strong></p>
    <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e8e8ed;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#D9B36C;">${label}</p>
      <p style="margin:0;color:#374151;white-space:pre-wrap;">${data.message.slice(0, 500)}</p>
    </div>
    ${emailButton("View Conversation", `${SITE_URL}/dashboard/support/${data.ticketId}`)}`,
    `${label} replied to "${data.ticketSubject}"`,
  );
  return build(subject, html);
}

// ── 11. Support Ticket — Status Update (to user) ──────────────────

export function supportTicketStatusEmail(data: {
  userName: string;
  ticketSubject: string;
  ticketId: string;
  newStatus: string;
}): EmailOutput {
  const statusLabels: Record<string, string> = {
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    open: "Reopened",
  };
  const label = statusLabels[data.newStatus] ?? data.newStatus;

  const subject = `Ticket ${label.toLowerCase()}: ${data.ticketSubject}`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">Ticket ${label}</h2>
    <p>Hi ${data.userName}, your support ticket has been updated.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        ${emailDetailRow("Subject", data.ticketSubject)}
      </tr>
      <tr>
        ${emailDetailRow("New Status", label)}
      </tr>
    </table>
    ${data.newStatus === "resolved" ? `<p>If this doesn't resolve your issue, you can reply to reopen the ticket.</p>` : ""}
    ${emailButton("View Ticket", `${SITE_URL}/dashboard/support/${data.ticketId}`)}`,
    `Your ticket "${data.ticketSubject}" is now ${label.toLowerCase()}`,
  );
  return build(subject, html);
}

// ── 12. Booking Reminder (24h before, to client) ────────────────────

export function bookingReminderEmail(data: {
  clientName: string;
  bookingId: string;
  serviceName: string;
  businessName: string;
  staffName: string;
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
  address?: string;
}): EmailOutput {
  const ref = bookingRef(data.bookingId);
  const subject = `Reminder: ${data.serviceName} tomorrow — ${ref}`;
  const html = emailLayout(
    `<h2 style="margin:0 0 16px;font-size:22px;">See you tomorrow, ${data.clientName}!</h2>
    <p>Just a friendly reminder that you have an appointment coming up:</p>
    ${bookingDetailsTable({
      ref,
      service: data.serviceName,
      business: data.businessName,
      date: formatDate(data.startsAt),
      time: formatTime(data.startsAt, data.timezone),
      duration: data.durationMinutes,
      staff: data.staffName,
    })}
    ${data.address ? `<p style="font-size:14px;"><strong>Location:</strong> ${data.address}</p>` : ""}
    <p style="font-size:14px;">Need to reschedule or cancel? You can manage your booking from your dashboard.</p>
    ${emailButton("View My Bookings", `${SITE_URL}/dashboard/bookings`)}
    <p style="color:#6b7280;font-size:13px;">We look forward to seeing you!</p>`,
    `Reminder: ${data.serviceName} at ${data.businessName} tomorrow`,
  );
  return build(subject, html);
}
