// Reference pattern for the server page that fetches all data
// This is the data-fetching layer — adapt queries to your database

import { ExploreClient } from "./explore-client";

// Adapt: your data source (Supabase shown, but works with Prisma, Drizzle, etc.)
// import { createClient } from "@/lib/supabase/server";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    date?: string;
    time?: string;
  }>;
}) {
  const params = await searchParams;
  // const supabase = await createClient();

  // 1. Fetch ALL data in parallel (not filtered — client handles filtering)
  const [categories, listings, services, hours, reviews, user] =
    await Promise.all([
      fetchCategories(),
      fetchPublishedListings(), // all published, limit 200-500
      fetchActiveServices(),
      fetchOperatingHours(),
      fetchPublishedReviews(),
      fetchCurrentUser(),
    ]);

  // 2. Build rating map: listingId → { sum, count }
  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const existing = ratingMap.get(r.listing_id);
    if (existing) {
      existing.sum += r.rating;
      existing.count++;
    } else {
      ratingMap.set(r.listing_id, { sum: r.rating, count: 1 });
    }
  }

  // 3. Build favorites set (if logged in)
  const favSet = new Set<string>();
  if (user) {
    const favs = await fetchFavorites(user.id);
    favs.forEach((f) => favSet.add(f.listing_id));
  }

  // 4. Build service/tag name suggestions with business counts
  const publishedIds = new Set(listings.map((l) => l.id));
  const svcMap = new Map<string, Set<string>>();
  for (const s of services) {
    if (!publishedIds.has(s.listing_id)) continue;
    const key = s.name.trim();
    if (!svcMap.has(key)) svcMap.set(key, new Set());
    svcMap.get(key)!.add(s.listing_id);
  }
  const serviceNames = Array.from(svcMap.entries())
    .map(([name, ids]) => ({ name, count: ids.size }))
    .sort((a, b) => b.count - a.count);

  // 5. Build hours map: listingId → day/open/close array
  const hoursMap: Record<
    string,
    Array<{ day_of_week: number; open_time: string; close_time: string }>
  > = {};
  for (const h of hours) {
    if (!h.open_time || !h.close_time) continue;
    if (!hoursMap[h.listing_id]) hoursMap[h.listing_id] = [];
    hoursMap[h.listing_id].push({
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
    });
  }

  // 6. Serialize listings with computed fields
  const serialized = listings.map((item) => {
    const stats = ratingMap.get(item.id);
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      imageUrl: resolveImage(item),
      city: item.city,
      country: item.country,
      is_featured: item.is_featured,
      latitude: item.latitude,
      longitude: item.longitude,
      categoryName: item.category?.name ?? null,
      categorySlug: item.category?.slug ?? null,
      avgRating: stats ? stats.sum / stats.count : null,
      reviewCount: stats?.count ?? 0,
      isFavorited: favSet.has(item.id),
    };
  });

  // 7. Pass everything to the client component
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
        date: params.date ?? "",
        time: params.time ?? "",
      }}
      isLoggedIn={!!user}
      hasMapKey={!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    />
  );
}

// Placeholder functions — replace with your actual data fetching
async function fetchCategories() { return []; }
async function fetchPublishedListings() { return [] as any[]; }
async function fetchActiveServices() { return [] as any[]; }
async function fetchOperatingHours() { return [] as any[]; }
async function fetchPublishedReviews() { return [] as any[]; }
async function fetchCurrentUser() { return null as any; }
async function fetchFavorites(_userId: string) { return [] as any[]; }
function resolveImage(_item: any): string | null { return null; }
