import { createClient } from "@/lib/supabase/server";
import { ExploreClient } from "./explore-client";
import type { ExploreBusiness } from "@/lib/explore/actions";
import { resolveCardImage } from "@/lib/explore/utils";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch categories, businesses, services, hours, reviews, favorites in parallel
  const [catRes, bizRes, svcRes, hoursRes, reviewRes, userRes] =
    await Promise.all([
      supabase
        .from("service_categories")
        .select("id, name, slug")
        .order("sort_order"),
      supabase
        .from("businesses")
        .select(
          "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, latitude, longitude, primary_category_id, service_categories(name, slug)",
        )
        .eq("is_published", true)
        .eq("verification_status", "verified")
        .order("is_featured", { ascending: false })
        .limit(200),
      supabase
        .from("services")
        .select("name, business_id, category_id")
        .eq("is_active", true),
      supabase
        .from("business_hours")
        .select("business_id, day_of_week, open_time, close_time"),
      supabase
        .from("reviews")
        .select("business_id, rating")
        .eq("status", "published"),
      supabase.auth.getUser(),
    ]);

  const categories = catRes.data ?? [];
  const businesses = bizRes.data ?? [];
  const services = svcRes.data ?? [];
  const hours = hoursRes.data ?? [];
  const reviewStats = reviewRes.data ?? [];
  const user = userRes.data?.user;

  // Rating map
  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of reviewStats) {
    const existing = ratingMap.get(r.business_id);
    if (existing) {
      existing.sum += r.rating;
      existing.count++;
    } else {
      ratingMap.set(r.business_id, { sum: r.rating, count: 1 });
    }
  }

  // Favorites
  const favSet = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("business_id")
      .eq("client_id", user.id);
    favs?.forEach((f) => favSet.add(f.business_id));
  }

  // Published business IDs for filtering services
  const publishedBizIds = new Set(businesses.map((b) => b.id));

  // Unique service names with count of businesses offering them
  const svcMap = new Map<string, Set<string>>();
  for (const s of services) {
    if (!publishedBizIds.has(s.business_id)) continue;
    const key = s.name.trim();
    if (!svcMap.has(key)) svcMap.set(key, new Set());
    svcMap.get(key)!.add(s.business_id);
  }
  const serviceNames = Array.from(svcMap.entries())
    .map(([name, bizIds]) => ({ name, count: bizIds.size }))
    .sort((a, b) => b.count - a.count);

  // Business hours map: businessId → array of { day_of_week, open_time, close_time }
  const hoursMap: Record<
    string,
    Array<{ day_of_week: number; open_time: string; close_time: string }>
  > = {};
  for (const h of hours) {
    if (!h.open_time || !h.close_time) continue;
    if (!hoursMap[h.business_id]) hoursMap[h.business_id] = [];
    hoursMap[h.business_id].push({
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
    });
  }

  // Serialize businesses
  const serialized: ExploreBusiness[] = businesses.map((biz) => {
    const stats = ratingMap.get(biz.id);
    const cat = biz.service_categories as unknown as {
      name: string;
      slug: string;
    } | null;
    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      logo_url: biz.logo_url,
      cover_url: biz.cover_url,
      imageUrl: resolveCardImage(biz),
      city: biz.city,
      country: biz.country,
      is_featured: biz.is_featured,
      latitude: biz.latitude,
      longitude: biz.longitude,
      categoryName: cat?.name ?? null,
      categorySlug: cat?.slug ?? null,
      avgRating: stats ? stats.sum / stats.count : null,
      reviewCount: stats?.count ?? 0,
      isFavorited: favSet.has(biz.id),
    };
  });

  return (
    <ExploreClient
      businesses={serialized}
      categories={categories}
      serviceNames={serviceNames}
      businessHours={hoursMap}
      initialFilters={{
        q: params.q ?? "",
        category: params.category ?? "",
        city: params.city ?? "",
      }}
      isLoggedIn={!!user}
      hasMapKey={!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    />
  );
}
