/**
 * End-to-end test of every email-triggering action.
 * Uses the admin client to simulate each action directly.
 * Run: npx tsx scripts/test-actions.ts <your-email>
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

const TEST_EMAIL = process.argv[2];
if (!TEST_EMAIL) {
  console.error("Usage: npx tsx scripts/test-actions.ts <your-email>");
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Import email functions directly (bypasses auth checks)
import { sendEmail } from "../src/lib/email/resend";
import {
  welcomeEmail,
  bookingConfirmationEmail,
  bookingRescheduleEmail,
  bookingCancellationEmail,
  newBookingOwnerEmail,
  bookingCancelledByClientOwnerEmail,
  newReviewOwnerEmail,
  staffInvitationEmail,
} from "../src/lib/email/templates";
import { generateICSString } from "../src/lib/email/ics";

async function main() {
  console.log(`Testing all email actions → ${TEST_EMAIL}\n`);

  // ── Find test data ──
  const { data: confirmedBooking, error: bkErr } = await sb
    .from("bookings")
    .select(
      `id, client_id, staff_id, starts_at, ends_at, service_amount, currency,
       services(name, duration_minutes),
       staff(display_name),
       businesses(name, timezone, owner_id, address, city)`,
    )
    .eq("status", "confirmed")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .single();

  if (!confirmedBooking) {
    console.error("No confirmed future booking found", bkErr);
    process.exit(1);
  }

  // Fetch client name separately
  const { data: clientProfile } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", confirmedBooking.client_id)
    .single();

  const biz = confirmedBooking.businesses as any;
  const svc = confirmedBooking.services as any;
  const staff = confirmedBooking.staff as any;
  const bookingId = confirmedBooking.id;
  const startsAt = new Date(confirmedBooking.starts_at);
  const endsAt = new Date(confirmedBooking.ends_at);
  const tz = biz?.timezone ?? "Africa/Nairobi";

  console.log(`Using booking: ${bookingId.slice(0, 8)}...`);
  console.log(`  ${svc?.name} at ${biz?.name}`);
  console.log(`  Client: ${clientProfile?.full_name}, Staff: ${staff?.display_name}`);
  console.log(`  Starts: ${startsAt.toISOString()}\n`);

  const ref = "ZW-" + bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();

  // ── 1. Welcome ──
  process.stdout.write("1. Welcome email... ");
  const w = welcomeEmail("Test User");
  const r1 = await sendEmail({ to: TEST_EMAIL, ...w });
  console.log(r1 ? "SENT" : "FAILED");

  // ── 2. Booking Confirmation (with .ics) ──
  process.stdout.write("2. Booking confirmation (with .ics)... ");
  const ics = generateICSString({
    title: `${svc?.name} at ${biz?.name}`,
    start: startsAt,
    end: endsAt,
    timezone: tz,
    location: [biz?.address, biz?.city].filter(Boolean).join(", ") || undefined,
    description: `Booking ref: ${ref}`,
  });
  const bc = bookingConfirmationEmail({
    clientName: clientProfile?.full_name ?? "Client",
    bookingId,
    serviceName: svc?.name ?? "Service",
    businessName: biz?.name ?? "Business",
    staffName: staff?.display_name ?? "Staff",
    startsAt,
    durationMinutes: svc?.duration_minutes ?? 60,
    timezone: tz,
    amount: confirmedBooking.service_amount ?? undefined,
    currency: confirmedBooking.currency ?? undefined,
  });
  const r2 = await sendEmail({
    to: TEST_EMAIL,
    ...bc,
    attachments: [{ filename: "booking.ics", content: ics }],
  });
  console.log(r2 ? "SENT" : "FAILED");

  // ── 3. Booking Reschedule (with .ics) ──
  process.stdout.write("3. Booking reschedule (with .ics)... ");
  const oldStart = new Date(startsAt.getTime() - 24 * 60 * 60_000);
  const br = bookingRescheduleEmail({
    clientName: clientProfile?.full_name ?? "Client",
    bookingId,
    serviceName: svc?.name ?? "Service",
    businessName: biz?.name ?? "Business",
    staffName: staff?.display_name ?? "Staff",
    oldStartsAt: oldStart,
    newStartsAt: startsAt,
    durationMinutes: svc?.duration_minutes ?? 60,
    timezone: tz,
  });
  const r3 = await sendEmail({
    to: TEST_EMAIL,
    ...br,
    attachments: [{ filename: "booking-updated.ics", content: ics }],
  });
  console.log(r3 ? "SENT" : "FAILED");

  // ── 4. Booking Cancellation (to client) ──
  process.stdout.write("4. Booking cancellation (to client)... ");
  const bcancel = bookingCancellationEmail({
    clientName: clientProfile?.full_name ?? "Client",
    bookingId,
    serviceName: svc?.name ?? "Service",
    businessName: biz?.name ?? "Business",
    startsAt,
    timezone: tz,
    cancelledBy: "business",
  });
  const r4 = await sendEmail({ to: TEST_EMAIL, ...bcancel });
  console.log(r4 ? "SENT" : "FAILED");

  // ── 5. New Booking (to owner) ──
  process.stdout.write("5. New booking to owner... ");
  const nbo = newBookingOwnerEmail({
    ownerName: "Business Owner",
    clientName: clientProfile?.full_name ?? "Client",
    bookingId,
    serviceName: svc?.name ?? "Service",
    businessName: biz?.name ?? "Business",
    staffName: staff?.display_name ?? "Staff",
    startsAt,
    durationMinutes: svc?.duration_minutes ?? 60,
    timezone: tz,
    amount: confirmedBooking.service_amount ?? undefined,
    currency: confirmedBooking.currency ?? undefined,
  });
  const r5 = await sendEmail({ to: TEST_EMAIL, ...nbo });
  console.log(r5 ? "SENT" : "FAILED");

  // ── 6. Cancelled by Client (to owner) ──
  process.stdout.write("6. Cancelled by client to owner... ");
  const cbo = bookingCancelledByClientOwnerEmail({
    ownerName: "Business Owner",
    clientName: clientProfile?.full_name ?? "Client",
    bookingId,
    serviceName: svc?.name ?? "Service",
    startsAt,
    timezone: tz,
  });
  const r6 = await sendEmail({ to: TEST_EMAIL, ...cbo });
  console.log(r6 ? "SENT" : "FAILED");

  // ── 7. New Review (to owner) ──
  process.stdout.write("7. New review to owner... ");
  const nro = newReviewOwnerEmail({
    ownerName: "Business Owner",
    clientName: clientProfile?.full_name ?? "Client",
    rating: 5,
    comment: "Absolutely loved the service! Will definitely come back.",
    serviceName: svc?.name ?? "Service",
    businessName: biz?.name ?? "Business",
  });
  const r7 = await sendEmail({ to: TEST_EMAIL, ...nro });
  console.log(r7 ? "SENT" : "FAILED");

  // ── 8. Staff Invitation ──
  process.stdout.write("8. Staff invitation... ");
  const si = staffInvitationEmail({
    staffName: "New Stylist",
    businessName: biz?.name ?? "Business",
    inviteToken: "test-token-" + Date.now(),
    invitedBy: "Business Owner",
  });
  const r8 = await sendEmail({ to: TEST_EMAIL, ...si });
  console.log(r8 ? "SENT" : "FAILED");

  // ── Summary ──
  const results = [r1, r2, r3, r4, r5, r6, r7, r8];
  const sent = results.filter(Boolean).length;
  console.log(`\nResults: ${sent}/8 sent`);

  if (sent === 8) {
    console.log("\nAll 8 emails sent. Check your inbox and verify:");
    console.log("  - #2 has booking.ics attachment");
    console.log("  - #3 has booking-updated.ics attachment");
    console.log("  - #7 has 'Manage email preferences' link in footer");
    console.log("  - All use REAL booking data from your database");
    console.log(`  - Booking ref: ${ref}`);
  }
}

main().catch(console.error);
