/**
 * Delete real accounts (except super admin) and their associated data.
 * Run: npx tsx scripts/delete-real-accounts.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const KEEP = "edwinnchaga@gmail.com";

const TO_DELETE = [
  "designsmagnate@gmail.com",
  "eddthetraveller@yahoo.com",
  "outlastappareltees@gmail.com",
  "magnate@yahoo.com",
  "edwinomandi@yahoo.com",
  "nchaga1993@yahoo.com",
];

async function main() {
  const {
    data: { users },
  } = await s.auth.admin.listUsers({ perPage: 200 });

  const targets = users.filter(
    (u) => u.email && TO_DELETE.includes(u.email),
  );

  console.log(`Found ${targets.length} accounts to delete (keeping ${KEEP}):\n`);

  for (const user of targets) {
    console.log(`Deleting ${user.email} (${user.id})...`);

    // 1. Find their businesses
    const { data: businesses } = await s
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id);

    for (const biz of businesses ?? []) {
      console.log(`  Cleaning business: ${biz.name}`);

      // Get staff IDs for this business
      const { data: staff } = await s
        .from("staff")
        .select("id")
        .eq("business_id", biz.id);
      const staffIds = (staff ?? []).map((st) => st.id);

      if (staffIds.length > 0) {
        // Delete staff_services
        await s.from("staff_services").delete().in("staff_id", staffIds);
        // Delete staff_schedules
        await s.from("staff_schedules").delete().in("staff_id", staffIds);
        // Delete staff
        await s.from("staff").delete().eq("business_id", biz.id);
      }

      // Delete services
      await s.from("services").delete().eq("business_id", biz.id);
      // Delete business_hours
      await s.from("business_hours").delete().eq("business_id", biz.id);
      // Delete business_contacts
      await s.from("business_contacts").delete().eq("business_id", biz.id);
      // Delete bookings
      await s.from("bookings").delete().eq("business_id", biz.id);
      // Delete reviews
      await s.from("reviews").delete().eq("business_id", biz.id);
      // Delete subscriptions
      await s.from("subscriptions").delete().eq("business_id", biz.id);
      // Delete the business
      const { error: bizErr } = await s
        .from("businesses")
        .delete()
        .eq("id", biz.id);
      if (bizErr) console.log(`  WARN: business delete: ${bizErr.message}`);
    }

    // 2. Delete bookings where user is client
    await s.from("bookings").delete().eq("client_id", user.id);
    // Delete reviews where user is reviewer
    await s.from("reviews").delete().eq("user_id", user.id);
    // Delete favorites
    await s.from("favorites").delete().eq("user_id", user.id);
    // Delete notification_preferences
    await s.from("notification_preferences").delete().eq("user_id", user.id);

    // 3. Delete profile
    const { error: profErr } = await s
      .from("profiles")
      .delete()
      .eq("id", user.id);
    if (profErr) console.log(`  WARN: profile delete: ${profErr.message}`);

    // 4. Delete auth user
    const { error: authErr } = await s.auth.admin.deleteUser(user.id);
    if (authErr) console.log(`  WARN: auth delete: ${authErr.message}`);

    console.log(`  Done.`);
  }

  // Verify
  const {
    data: { users: remaining },
  } = await s.auth.admin.listUsers({ perPage: 200 });
  const realRemaining = remaining.filter((u) => {
    const email = u.email || "";
    return (
      !email.endsWith("@krowned.app") &&
      !email.includes("demo") &&
      !email.includes("seed") &&
      !email.includes("example.com")
    );
  });

  console.log(`\nDone! Real accounts remaining: ${realRemaining.length}`);
  for (const u of realRemaining) {
    console.log(`  ${u.email}`);
  }
}

main();
