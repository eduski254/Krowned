/**
 * Seed 4 test accounts for QA testing.
 *
 * Usage: npx tsx scripts/seed-test-accounts.ts
 *
 * Accounts:
 * 1. magnate@yahoo.com — Business owner, "Magnate Cuts & Grooming", Starter/trialing
 * 2. designsmagnate@ygmail.com — Staff member at Magnate Cuts & Grooming
 * 3. Outlastappareltees@gmail.com — Client (no bookings)
 * 4. edwinomandi@yahoo.com — Business owner, "Serene Nails & Spa", Pro/active
 *
 * Also verifies edwinnchaga@gmail.com is intact as super_admin.
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PASSWORD = "Test1234!";

async function createUser(email: string, fullName: string) {
  // Check if user already exists in auth
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = allUsers?.users?.find((u) => u.email === email || u.email === email.toLowerCase());

  if (existing) {
    // Reset password to known test password
    await supabase.auth.admin.updateUserById(existing.id, { password: PASSWORD });
    console.log(`  User ${email} already exists (${existing.id}), password reset.`);
    await supabase.from("profiles").upsert({ id: existing.id, full_name: fullName }, { onConflict: "id" });
    return existing.id;
  }

  // Try to create; if already registered in auth, list and find them
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    throw new Error(`Failed to create user ${email}: ${error.message}`);
  }

  console.log(`  Created user ${email} → ${data.user.id}`);
  return data.user.id;
}

async function getPlanId(tier: string): Promise<string> {
  const { data, error } = await supabase
    .from("plans")
    .select("id")
    .eq("tier", tier)
    .maybeSingle();
  if (error || !data) throw new Error(`Plan '${tier}' not found`);
  return data.id;
}

async function getCategoryId(name: string): Promise<string> {
  const { data, error } = await supabase
    .from("service_categories")
    .select("id")
    .ilike("name", `%${name}%`)
    .limit(1)
    .single();
  if (error || !data) throw new Error(`Category '${name}' not found: ${error?.message}`);
  return data.id;
}

async function seedMagnateCuts() {
  console.log("\n--- 1. magnate@yahoo.com (Business Owner) ---");
  const userId = await createUser("magnate@yahoo.com", "Magnate Barber");

  const starterPlanId = await getPlanId("starter");
  const categoryId = await getCategoryId("Hair & Barber");

  // Check if business exists
  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  let businessId: string;
  if (existingBiz) {
    businessId = existingBiz.id;
    console.log(`  Business already exists (${businessId})`);
  } else {
    const { data: biz, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name: "Magnate Cuts & Grooming",
        slug: "magnate-cuts-grooming",
        description: "Premium barbershop offering classic cuts, beard grooming, and hot towel shaves in a modern setting.",
        primary_category_id: categoryId,
        plan_id: starterPlanId,
        subscription_status: "trialing",
        city: "Nairobi",
        country: "KE",
        address: "Westlands, Nairobi",
        latitude: -1.2635,
        longitude: 36.8030,
        timezone: "Africa/Nairobi",
        phone: "+254700111222",
        is_published: true,
        verification_status: "verified",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create business: ${error.message}`);
    businessId = biz.id;
    console.log(`  Created business "Magnate Cuts & Grooming" → ${businessId}`);
  }

  // Add staff (owner as staff)
  const { data: existingStaff } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  let ownerStaffId: string;
  if (existingStaff) {
    ownerStaffId = existingStaff.id;
  } else {
    const { data: staff, error } = await supabase
      .from("staff")
      .insert({
        business_id: businessId,
        user_id: userId,
        display_name: "Magnate",
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create staff: ${error.message}`);
    ownerStaffId = staff.id;
    console.log(`  Created owner staff → ${ownerStaffId}`);
  }

  // Add services
  const services = [
    { name: "Classic Haircut", duration_minutes: 30, price_amount: 150000, currency: "KES" },
    { name: "Beard Trim & Shape", duration_minutes: 20, price_amount: 80000, currency: "KES" },
    { name: "Hot Towel Shave", duration_minutes: 45, price_amount: 200000, currency: "KES" },
  ];

  for (const svc of services) {
    const { data: existing } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", svc.name)
      .maybeSingle();
    if (existing) continue;

    const { data: created, error } = await supabase
      .from("services")
      .insert({ ...svc, business_id: businessId, category_id: categoryId, payment_option: "both", is_active: true })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create service ${svc.name}: ${error.message}`);

    // Link service to owner staff
    await supabase.from("staff_services").insert({
      staff_id: ownerStaffId,
      service_id: created.id,
    });
    console.log(`  Service: ${svc.name} → ${created.id}`);
  }

  // Business hours (Mon-Sat 8am-6pm)
  const { data: existingHours } = await supabase
    .from("business_hours")
    .select("id")
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();

  if (!existingHours) {
    const days = [1, 2, 3, 4, 5, 6]; // Mon-Sat
    for (const dow of days) {
      await supabase.from("business_hours").insert({
        business_id: businessId,
        day_of_week: dow,
        open_time: "08:00",
        close_time: "18:00",
      });
    }
    console.log(`  Business hours set (Mon-Sat 8am-6pm)`);
  }

  return { businessId, ownerStaffId };
}

async function seedDesignsMagnateStaff(businessId: string) {
  console.log("\n--- 2. designsmagnate@ygmail.com (Staff) ---");
  const userId = await createUser("designsmagnate@ygmail.com", "Designs Magnate");

  const { data: existingStaff } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingStaff) {
    console.log(`  Staff already exists (${existingStaff.id})`);
    return;
  }

  const { data: staff, error } = await supabase
    .from("staff")
    .insert({
      business_id: businessId,
      user_id: userId,
      display_name: "Designs",
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create staff: ${error.message}`);
  console.log(`  Created staff at Magnate Cuts → ${staff.id}`);

  // Link to all services at that business
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .eq("business_id", businessId);

  for (const svc of services ?? []) {
    await supabase.from("staff_services").insert({
      staff_id: staff.id,
      service_id: svc.id,
    }).then(() => {});
  }
  console.log(`  Linked to ${services?.length ?? 0} services`);
}

async function seedOutlastClient() {
  console.log("\n--- 3. Outlastappareltees@gmail.com (Client) ---");
  await createUser("Outlastappareltees@gmail.com", "Outlast Apparel");
  console.log(`  Client account ready (no bookings)`);
}

async function seedEdwinOmandi() {
  console.log("\n--- 4. edwinomandi@yahoo.com (Business Owner) ---");
  const userId = await createUser("edwinomandi@yahoo.com", "Edwin Omandi");

  const proPlanId = await getPlanId("pro");
  const categoryId = await getCategoryId("Nails & Beauty");

  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  let businessId: string;
  if (existingBiz) {
    businessId = existingBiz.id;
    console.log(`  Business already exists (${businessId})`);
  } else {
    const { data: biz, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name: "Serene Nails & Spa",
        slug: "serene-nails-spa",
        description: "Luxury nail artistry and relaxation spa offering gel nails, pedicures, and full-body massages.",
        primary_category_id: categoryId,
        plan_id: proPlanId,
        subscription_status: "active",
        city: "Nairobi",
        country: "KE",
        address: "Karen, Nairobi",
        latitude: -1.3187,
        longitude: 36.7112,
        timezone: "Africa/Nairobi",
        phone: "+254700333444",
        is_published: true,
        verification_status: "verified",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create business: ${error.message}`);
    businessId = biz.id;
    console.log(`  Created business "Serene Nails & Spa" → ${businessId}`);
  }

  // Owner as staff
  const { data: existingStaff } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  let staffId: string;
  if (existingStaff) {
    staffId = existingStaff.id;
  } else {
    const { data: staff, error } = await supabase
      .from("staff")
      .insert({
        business_id: businessId,
        user_id: userId,
        display_name: "Edwin",
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create staff: ${error.message}`);
    staffId = staff.id;
    console.log(`  Created owner staff → ${staffId}`);
  }

  // Services
  const services = [
    { name: "Gel Manicure", duration_minutes: 45, price_amount: 250000, currency: "KES" },
    { name: "Classic Pedicure", duration_minutes: 60, price_amount: 300000, currency: "KES" },
    { name: "Full Body Massage", duration_minutes: 90, price_amount: 500000, currency: "KES" },
  ];

  for (const svc of services) {
    const { data: existing } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", svc.name)
      .maybeSingle();
    if (existing) continue;

    const { data: created, error } = await supabase
      .from("services")
      .insert({ ...svc, business_id: businessId, category_id: categoryId, payment_option: "both", is_active: true })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create service ${svc.name}: ${error.message}`);

    await supabase.from("staff_services").insert({
      staff_id: staffId,
      service_id: created.id,
    });
    console.log(`  Service: ${svc.name} → ${created.id}`);
  }

  // Business hours (Mon-Sun 9am-7pm)
  const { data: existingHours } = await supabase
    .from("business_hours")
    .select("id")
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();

  if (!existingHours) {
    for (let dow = 0; dow <= 6; dow++) {
      await supabase.from("business_hours").insert({
        business_id: businessId,
        day_of_week: dow,
        open_time: "09:00",
        close_time: "19:00",
      });
    }
    console.log(`  Business hours set (Mon-Sun 9am-7pm)`);
  }
}

async function verifySuperAdmin() {
  console.log("\n--- 5. Verify edwinnchaga@gmail.com (Super Admin) ---");
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUser = allUsers?.users?.find((u) => u.email === "edwinnchaga@gmail.com");

  if (!authUser) {
    console.log("  WARNING: edwinnchaga@gmail.com NOT FOUND in auth!");
    return;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, platform_role")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!data) {
    console.log("  WARNING: Profile not found for auth user!");
    return;
  }

  if (data.platform_role === "super_admin") {
    console.log(`  CONFIRMED: ${data.full_name} (${data.id}) is super_admin`);
  } else {
    console.log(`  WARNING: platform_role is '${data.platform_role}', expected 'super_admin'`);
  }
}

async function main() {
  console.log("=== Seeding Test Accounts ===");
  console.log(`Password for all: ${PASSWORD}\n`);

  const { businessId } = await seedMagnateCuts();
  await seedDesignsMagnateStaff(businessId);
  await seedOutlastClient();
  await seedEdwinOmandi();
  await verifySuperAdmin();

  console.log("\n=== Summary ===");
  console.log("| Email                          | Role           | Business/Notes              |");
  console.log("|--------------------------------|----------------|-----------------------------|");
  console.log("| magnate@yahoo.com              | Business Owner | Magnate Cuts & Grooming     |");
  console.log("| designsmagnate@ygmail.com      | Staff          | Staff at Magnate Cuts       |");
  console.log("| Outlastappareltees@gmail.com   | Client         | No bookings                 |");
  console.log("| edwinomandi@yahoo.com          | Business Owner | Serene Nails & Spa          |");
  console.log("| edwinnchaga@gmail.com          | Super Admin    | Platform admin (verified)   |");
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
