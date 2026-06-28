/**
 * Sync STRIPE_PRICE_* env vars into plans.stripe_price_id.
 * Run: npx tsx scripts/sync-stripe-prices.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TIER_ENV_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

async function main() {
  for (const [tier, priceId] of Object.entries(TIER_ENV_MAP)) {
    if (!priceId) {
      console.log(`⏭  ${tier}: no STRIPE_PRICE_${tier.toUpperCase()} set — skipping`);
      continue;
    }

    const { error } = await sb
      .from("plans")
      .update({ stripe_price_id: priceId })
      .eq("tier", tier);

    if (error) {
      console.error(`✗  ${tier}: ${error.message}`);
    } else {
      console.log(`✓  ${tier}: ${priceId}`);
    }
  }

  // Verify
  const { data } = await sb.from("plans").select("tier, name, stripe_price_id, per_seat_price").order("per_seat_price");
  console.log("\nCurrent plans:");
  for (const p of data ?? []) {
    console.log(`  ${p.tier} (${p.name}): ${p.stripe_price_id ?? "—"} @ $${(p.per_seat_price / 100).toFixed(2)}/seat`);
  }
}

main().catch(console.error);
