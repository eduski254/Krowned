import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: cat } = await sb.from("service_categories").select("id").eq("slug", "fitness-wellnesss").single();
  const { data: plans } = await sb.from("plans").select("id, tier");
  const planMap = Object.fromEntries((plans ?? []).map((p) => [p.tier, p.id]));

  const businesses = [
    { name: "Body Sculpt Fitness", city: "Kilimani", country: "KE", lat: -1.288, lng: 36.783, desc: "Boutique fitness studio with personalized training programs.", tier: "pro",
      cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop" },
    { name: "Iron Temple Gym", city: "Kisumu", country: "KE", lat: -0.101, lng: 34.76, desc: "Hardcore training facility with expert coaches and modern equipment.", tier: "starter",
      cover: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=600&fit=crop" },
  ];

  for (const def of businesses) {
    const slug = def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: existing } = await sb.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (existing) { console.log(def.name + " already exists"); continue; }

    const email = `owner_${slug}@zawaditest.com`;
    const ownerName = `Owner ${def.name.split(" ")[0]}`;
    const { data: user, error: ue } = await sb.auth.admin.createUser({ email, password: "Test1234!", email_confirm: true, user_metadata: { full_name: ownerName } });
    if (ue) { console.error(ue.message); continue; }
    await sb.from("profiles").upsert({ id: user.user.id, full_name: ownerName }, { onConflict: "id" });

    const planId = planMap[def.tier];
    const isPaid = def.tier !== "free";
    const { data: biz, error: be } = await sb.from("businesses").insert({
      owner_id: user.user.id, name: def.name, slug, description: def.desc,
      primary_category_id: cat!.id,
      phone: `+254 7${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `hello@${slug}.test`,
      address: `${Math.floor(10 + Math.random() * 90)} ${def.city} Road`,
      city: def.city, country: def.country, latitude: def.lat, longitude: def.lng,
      cover_url: def.cover,
      logo_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop",
      default_payment_option: "both" as const, commission_rate: 0.05,
      verification_status: "verified" as const, charges_enabled: isPaid, payouts_enabled: isPaid,
      plan_id: planId, subscription_status: isPaid ? ("active" as const) : ("canceled" as const),
      booking_link_token: `blt-${slug}`, is_published: true, onboarding_completed_at: new Date().toISOString(),
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&h=600&fit=crop",
      ]),
    }).select("id").single();

    if (be) { console.error(`${def.name}: ${be.message}`); continue; }
    const bizId = biz.id;

    await sb.from("business_hours").insert([1, 2, 3, 4, 5, 6].map((d) => ({ business_id: bizId, day_of_week: d, open_time: "09:00:00", close_time: "18:00:00" })));
    if (isPaid) {
      await sb.from("subscriptions").insert({ business_id: bizId, plan_id: planId, status: "active", seat_count: 1, current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(), cancel_at_period_end: false });
    }
    await sb.from("services").insert([
      { business_id: bizId, category_id: cat!.id, name: "Personal Training", price_amount: 3000, currency: "USD", duration_minutes: 60, payment_option: "both" as const, is_active: true },
      { business_id: bizId, category_id: cat!.id, name: "Group Class", price_amount: 1500, currency: "USD", duration_minutes: 45, payment_option: "both" as const, is_active: true },
      { business_id: bizId, category_id: cat!.id, name: "Boxing Fitness", price_amount: 2500, currency: "USD", duration_minutes: 45, payment_option: "both" as const, is_active: true },
    ]);
    await sb.from("staff").insert({ business_id: bizId, user_id: user.user.id, display_name: ownerName, title: "Head Coach", status: "active" as const });
    console.log(`✓ ${def.name}`);
  }
}

main().catch(console.error);
