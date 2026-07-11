import { createClient } from "@/lib/supabase/server";
import { isBookable } from "@/lib/plans";
import { NextResponse } from "next/server";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*, service_categories(name), plans(tier, features)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [servicesRes, staffRes, hoursRes, reviewsRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, price_amount, currency, duration_minutes, payment_option")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("staff")
      .select("id, display_name, title, avatar_url")
      .eq("business_id", business.id)
      .eq("status", "active"),
    supabase
      .from("business_hours")
      .select("day_of_week, open_time, close_time")
      .eq("business_id", business.id)
      .order("day_of_week"),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, clients:client_id(full_name, avatar_url)")
      .eq("business_id", business.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const services = (servicesRes.data ?? []).filter(
    (s) => s.name.trim().length >= 3 && !/^test/i.test(s.name.trim()),
  );
  const staff = staffRes.data ?? [];
  const hours = hoursRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const plan = business.plans as unknown as { tier: string; features: Record<string, unknown> } | null;
  const bookable = isBookable(plan?.tier, business.subscription_status);

  const formattedHours = DAY_NAMES.map((dayName, dayIdx) => {
    const h = hours.find((hr) => hr.day_of_week === dayIdx);
    return {
      day: dayName,
      hours: h ? `${h.open_time?.slice(0, 5)} — ${h.close_time?.slice(0, 5)}` : "Closed",
      isOpen: !!h,
    };
  });

  return NextResponse.json({
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    logo_url: business.logo_url,
    cover_url: business.cover_url,
    city: business.city,
    country: business.country,
    address: business.address,
    phone: business.phone,
    email: business.email,
    social_links: business.social_links ?? null,
    booking_link_token: business.booking_link_token,
    categoryName: (business.service_categories as unknown as { name: string } | null)?.name ?? null,
    avgRating,
    reviewCount: reviews.length,
    bookable,
    services,
    staff,
    hours: formattedHours,
    reviews: reviews.map((r) => {
      const client = r.clients as unknown as { full_name: string | null; avatar_url: string | null } | null;
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewerName: client?.full_name || "A client",
        avatarUrl: client?.avatar_url ?? null,
      };
    }),
  });
}
