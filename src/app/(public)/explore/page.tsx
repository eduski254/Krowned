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

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, slug")
    .order("sort_order");

  // Build business query
  let query = supabase
    .from("businesses")
    .select(
      "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, latitude, longitude, primary_category_id, service_categories(name)",
    )
    .eq("is_published", true)
    .eq("verification_status", "verified")
    .order("is_featured", { ascending: false });

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }
  if (params.category) {
    const matchingCat = categories?.find((c) => c.slug === params.category);
    if (matchingCat) {
      query = query.eq("primary_category_id", matchingCat.id);
    }
  }

  const { data: businesses } = await query.limit(100);

  // Get average ratings
  const { data: reviewStats } = await supabase
    .from("reviews")
    .select("business_id, rating")
    .eq("status", "published");

  const ratingMap = new Map<string, { sum: number; count: number }>();
  reviewStats?.forEach((r) => {
    const existing = ratingMap.get(r.business_id);
    if (existing) {
      existing.sum += r.rating;
      existing.count++;
    } else {
      ratingMap.set(r.business_id, { sum: r.rating, count: 1 });
    }
  });

  // Get current user's favorites (if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favSet = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("business_id")
      .eq("client_id", user.id);
    favs?.forEach((f) => favSet.add(f.business_id));
  }

  const serialized: ExploreBusiness[] = (businesses ?? []).map((biz) => {
    const stats = ratingMap.get(biz.id);
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
      categoryName:
        (biz.service_categories as unknown as { name: string } | null)?.name ??
        null,
      avgRating: stats ? stats.sum / stats.count : null,
      reviewCount: stats?.count ?? 0,
      isFavorited: favSet.has(biz.id),
    };
  });

  return (
    <ExploreClient
      businesses={serialized}
      categories={categories ?? []}
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
