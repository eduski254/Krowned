/**
 * End-to-end email test script.
 * Run with: npx tsx scripts/test-emails.ts
 *
 * Prerequisites:
 *   - RESEND_API_KEY in .env.local
 *   - EMAIL_FROM in .env.local (or defaults to noreply@krowned.app)
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Seeded database with bookings, businesses, staff, reviews
 *
 * Tests each of the 8 tier-1 emails by calling the template + send
 * functions directly. Uses a real email address for delivery verification.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

// Verify env
if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set in .env.local");
  process.exit(1);
}

const TEST_EMAIL = process.argv[2];
if (!TEST_EMAIL) {
  console.error("Usage: npx tsx scripts/test-emails.ts <your-email>");
  process.exit(1);
}

console.log(`Sending test emails to: ${TEST_EMAIL}\n`);

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

const FAKE_BOOKING_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const FAKE_START = new Date(Date.now() + 3 * 24 * 60 * 60_000); // 3 days from now
const FAKE_END = new Date(FAKE_START.getTime() + 60 * 60_000); // +1 hour
const TZ = "America/New_York";

async function test(name: string, fn: () => Promise<boolean>) {
  process.stdout.write(`  ${name}... `);
  const ok = await fn();
  console.log(ok ? "SENT" : "FAILED");
  return ok;
}

async function main() {
  let sent = 0;
  let failed = 0;

  // 1. Welcome
  const r1 = await test("1. Welcome email", async () => {
    const mail = welcomeEmail("Test User");
    return sendEmail({ to: TEST_EMAIL, ...mail });
  });
  r1 ? sent++ : failed++;

  // 2. Booking confirmation (with .ics)
  const ics = generateICSString({
    title: "Knotless Braids (Medium) at Crown & Glory Braids",
    start: FAKE_START,
    end: FAKE_END,
    timezone: TZ,
    location: "8455 Colesville Rd, Silver Spring, MD 20910",
    description: `Booking ref: KR-${FAKE_BOOKING_ID.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
  });

  const r2 = await test("2. Booking confirmation (with .ics)", async () => {
    const mail = bookingConfirmationEmail({
      clientName: "Test User",
      bookingId: FAKE_BOOKING_ID,
      serviceName: "Knotless Braids (Medium)",
      businessName: "Crown & Glory Braids",
      staffName: "Keisha M.",
      startsAt: FAKE_START,
      durationMinutes: 360,
      timezone: TZ,
      amount: 25000,
      currency: "usd",
      address: "8455 Colesville Rd, Silver Spring, MD 20910",
    });
    return sendEmail({
      to: TEST_EMAIL,
      ...mail,
      attachments: [{ filename: "booking.ics", content: ics }],
    });
  });
  r2 ? sent++ : failed++;

  // 3. Booking reschedule (with .ics)
  const r3 = await test("3. Booking reschedule (with .ics)", async () => {
    const oldStart = new Date(FAKE_START.getTime() - 24 * 60 * 60_000);
    const mail = bookingRescheduleEmail({
      clientName: "Test User",
      bookingId: FAKE_BOOKING_ID,
      serviceName: "Knotless Braids (Medium)",
      businessName: "Crown & Glory Braids",
      staffName: "Keisha M.",
      oldStartsAt: oldStart,
      newStartsAt: FAKE_START,
      durationMinutes: 360,
      timezone: TZ,
      address: "8455 Colesville Rd, Silver Spring, MD 20910",
    });
    return sendEmail({
      to: TEST_EMAIL,
      ...mail,
      attachments: [{ filename: "booking-updated.ics", content: ics }],
    });
  });
  r3 ? sent++ : failed++;

  // 4. Booking cancellation
  const r4 = await test("4. Booking cancellation", async () => {
    const mail = bookingCancellationEmail({
      clientName: "Test User",
      bookingId: FAKE_BOOKING_ID,
      serviceName: "Knotless Braids (Medium)",
      businessName: "Crown & Glory Braids",
      startsAt: FAKE_START,
      timezone: TZ,
      cancelledBy: "business",
      address: "8455 Colesville Rd, Silver Spring, MD 20910",
    });
    return sendEmail({ to: TEST_EMAIL, ...mail });
  });
  r4 ? sent++ : failed++;

  // 5. New booking (to owner)
  const r5 = await test("5. New booking to owner", async () => {
    const mail = newBookingOwnerEmail({
      ownerName: "Business Owner",
      clientName: "Test User",
      bookingId: FAKE_BOOKING_ID,
      serviceName: "Knotless Braids (Medium)",
      businessName: "Crown & Glory Braids",
      staffName: "Keisha M.",
      startsAt: FAKE_START,
      durationMinutes: 360,
      timezone: TZ,
      amount: 25000,
      currency: "usd",
      address: "8455 Colesville Rd, Silver Spring, MD 20910",
    });
    return sendEmail({ to: TEST_EMAIL, ...mail });
  });
  r5 ? sent++ : failed++;

  // 6. Booking cancelled by client (to owner)
  const r6 = await test("6. Cancelled-by-client to owner", async () => {
    const mail = bookingCancelledByClientOwnerEmail({
      ownerName: "Business Owner",
      clientName: "Test User",
      bookingId: FAKE_BOOKING_ID,
      serviceName: "Knotless Braids (Medium)",
      startsAt: FAKE_START,
      timezone: TZ,
    });
    return sendEmail({ to: TEST_EMAIL, ...mail });
  });
  r6 ? sent++ : failed++;

  // 7. New review (to owner)
  const r7 = await test("7. New review to owner", async () => {
    const mail = newReviewOwnerEmail({
      ownerName: "Business Owner",
      clientName: "Test User",
      rating: 5,
      comment: "Knotless came out perfect. Keisha is patient and her partings are so clean. Took about 6 hours but worth every minute.",
      serviceName: "Knotless Braids (Medium)",
      businessName: "Crown & Glory Braids",
    });
    return sendEmail({ to: TEST_EMAIL, ...mail });
  });
  r7 ? sent++ : failed++;

  // 8. Staff invitation
  const r8 = await test("8. Staff invitation", async () => {
    const mail = staffInvitationEmail({
      staffName: "New Stylist",
      businessName: "Crown & Glory Braids",
      inviteToken: "test-invite-token-12345",
      invitedBy: "Business Owner",
    });
    return sendEmail({ to: TEST_EMAIL, ...mail });
  });
  r8 ? sent++ : failed++;

  console.log(`\nResults: ${sent} sent, ${failed} failed out of 8`);

  // Test fire-and-forget safety: send to invalid address
  console.log("\nTesting fire-and-forget safety (invalid recipient)...");
  const failResult = await sendEmail({
    to: "not-a-real-address-at-all",
    subject: "Should fail gracefully",
    html: "<p>This tests error handling</p>",
  });
  console.log(
    `  Invalid-recipient returned: ${failResult} (expected: false) — ${failResult === false ? "PASS" : "FAIL"}`,
  );

  console.log("\nDone! Check your inbox for all 8 emails.");
  console.log("Verify: booking confirmation (#2) has .ics attachment.");
  console.log("Verify: reschedule (#3) has updated .ics attachment.");
  console.log("Verify: review email (#7) has 'Manage email preferences' link in footer.");
  console.log("Verify: all emails have plaintext fallback (view source/raw in email client).");
}

main().catch(console.error);
