/**
 * Seed fake payment + payout data for the demo business.
 * Run: npx tsx scripts/seed-demo-payments.ts
 *
 * Creates payment rows for ~70% of completed prepay bookings,
 * plus bi-weekly payout records.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DEMO_SLUG = "crown-and-glory-braids";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding demo payments & payouts...\n");

  // 1. Find the demo business
  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .select("id, commission_rate")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();

  if (!biz || bizErr) {
    console.error("Demo business not found. Run seed-demo-business.ts first.");
    process.exit(1);
  }

  const bizId = biz.id;
  const commissionRate = biz.commission_rate ?? 0.1;

  // 2. Clean up existing demo payments & payouts
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("business_id", bizId);
  const bookingIds = existingBookings?.map((b) => b.id) ?? [];

  if (bookingIds.length) {
    await supabase.from("payments").delete().in("booking_id", bookingIds);
  }
  await supabase.from("payouts").delete().eq("business_id", bizId);
  console.log("  Cleaned existing payments/payouts.");

  // 3. Fetch completed prepay bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, service_amount, tip_amount, platform_fee_amount, currency, created_at, starts_at, payment_method")
    .eq("business_id", bizId)
    .eq("status", "completed")
    .eq("payment_method", "prepay")
    .order("starts_at", { ascending: true });

  if (!bookings?.length) {
    console.log("  No completed prepay bookings found. Generating payments for all completed bookings instead.");
  }

  // Also grab pay_at_store completed bookings — we'll create payments for some of them too
  // to simulate that some walk-ins paid via card at checkout
  const { data: allCompleted } = await supabase
    .from("bookings")
    .select("id, service_amount, tip_amount, platform_fee_amount, currency, created_at, starts_at, payment_method")
    .eq("business_id", bizId)
    .eq("status", "completed")
    .order("starts_at", { ascending: true });

  if (!allCompleted?.length) {
    console.error("  No completed bookings found.");
    process.exit(1);
  }

  // Create payments for ~70% of completed bookings
  const paymentBookings = allCompleted.filter(() => Math.random() < 0.7);

  interface PaymentRow {
    id: string;
    booking_id: string;
    amount: number;
    tip_amount: number;
    application_fee_amount: number;
    currency: string;
    status: string;
    stripe_payment_intent_id: string;
    created_at: string;
  }

  const payments: PaymentRow[] = paymentBookings.map((b) => {
    const totalAmount = b.service_amount + b.tip_amount;
    const appFee = Math.round(b.service_amount * commissionRate);
    // Payment created ~30 min before booking start (when client checks in / pays)
    const paymentDate = new Date(new Date(b.starts_at).getTime() - 30 * 60_000);

    return {
      id: randomUUID(),
      booking_id: b.id,
      amount: totalAmount,
      tip_amount: b.tip_amount,
      application_fee_amount: appFee,
      currency: b.currency || "usd",
      status: "succeeded",
      stripe_payment_intent_id: `pi_demo_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      created_at: paymentDate.toISOString(),
    };
  });

  // Insert in batches
  const BATCH = 50;
  let paymentErrors = 0;
  for (let i = 0; i < payments.length; i += BATCH) {
    const batch = payments.slice(i, i + BATCH);
    const { error } = await supabase.from("payments").insert(batch);
    if (error) {
      console.error(`  Payment batch ${i} error:`, error.message);
      paymentErrors++;
    }
  }
  console.log(`  ${payments.length} payments created${paymentErrors ? ` (${paymentErrors} batch errors)` : ""}.`);

  // 4. Generate bi-weekly payouts (every ~14 days)
  const startDate = new Date("2025-09-01"); // first payout ~1 month after business opened
  const today = new Date("2026-07-15");

  interface PayoutRow {
    id: string;
    business_id: string;
    amount: number;
    currency: string;
    status: string;
    stripe_payout_id: string;
    arrival_date: string;
    created_at: string;
  }

  const payouts: PayoutRow[] = [];
  const paymentsByDate = payments.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  let payoutDate = new Date(startDate);
  let paymentIdx = 0;

  while (payoutDate < today) {
    const nextPayoutDate = new Date(payoutDate.getTime() + 14 * 24 * 60 * 60_000);

    // Sum payments in this payout window
    let windowTotal = 0;
    let windowFees = 0;
    while (
      paymentIdx < paymentsByDate.length &&
      new Date(paymentsByDate[paymentIdx].created_at) < nextPayoutDate
    ) {
      windowTotal += paymentsByDate[paymentIdx].amount;
      windowFees += paymentsByDate[paymentIdx].application_fee_amount;
      paymentIdx++;
    }

    const netPayout = windowTotal - windowFees;
    if (netPayout > 0) {
      const arrivalDate = new Date(nextPayoutDate.getTime() + 2 * 24 * 60 * 60_000); // +2 days for bank transfer
      payouts.push({
        id: randomUUID(),
        business_id: bizId,
        amount: netPayout,
        currency: "usd",
        status: arrivalDate < today ? "paid" : "in_transit",
        stripe_payout_id: `po_demo_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        arrival_date: arrivalDate.toISOString().slice(0, 10),
        created_at: nextPayoutDate.toISOString(),
      });
    }

    payoutDate = nextPayoutDate;
  }

  if (payouts.length) {
    const { error: poErr } = await supabase.from("payouts").insert(payouts);
    if (poErr) console.error("  Payout insert error:", poErr.message);
    else console.log(`  ${payouts.length} payouts created.`);
  }

  // Summary
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalTips = payments.reduce((s, p) => s + p.tip_amount, 0);
  const totalFees = payments.reduce((s, p) => s + p.application_fee_amount, 0);
  const totalPayouts = payouts.reduce((s, p) => s + p.amount, 0);

  console.log("\n========================================");
  console.log("  DEMO EARNINGS SEEDED");
  console.log("========================================");
  console.log(`  Payments:     ${payments.length}`);
  console.log(`  Total Revenue: $${(totalRevenue / 100).toFixed(2)}`);
  console.log(`  Tips:          $${(totalTips / 100).toFixed(2)}`);
  console.log(`  Platform Fees: $${(totalFees / 100).toFixed(2)}`);
  console.log(`  Net Earnings:  $${((totalRevenue - totalFees) / 100).toFixed(2)}`);
  console.log(`  Payouts:       ${payouts.length} ($${(totalPayouts / 100).toFixed(2)})`);
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
