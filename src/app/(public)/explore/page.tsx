import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ExploreClient } from "./explore-client";
import type { ExploreBusiness } from "@/lib/explore/actions";
import { resolveCardImage } from "@/lib/explore/utils";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { SERVICE_LANDINGS } from "@/lib/service-landing-data";
import { CITY_PAGES } from "@/lib/cities-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = !!(params.q || params.category || params.city);

  // All filtered explore URLs canonicalize to /explore and are noindexed
  const base: Partial<Metadata> = hasFilters
    ? {
        robots: { index: false, follow: true },
        alternates: { canonical: `${SITE_URL}/explore` },
      }
    : {
        alternates: { canonical: `${SITE_URL}/explore` },
      };

  if (params.category) {
    const supabase = await createClient();
    const { data: cat } = await supabase
      .from("service_categories")
      .select("name")
      .eq("slug", params.category)
      .maybeSingle();

    if (cat) {
      const city = params.city || "the DMV";
      return {
        title: `${cat.name} Stylists in ${city}`,
        description: `Find and book ${cat.name.toLowerCase()} specialists in ${city}. Browse verified stylists, see real availability, and book instantly on Krowned.`,
        ...base,
      };
    }
  }

  return {
    title: "Hair Braiders & Stylists Near Me in DC, MD & VA",
    description:
      "Find hair braiders near me, loc retwist near me, and textured-hair stylists in DC, Maryland, and Northern Virginia. Filter by style, location, and availability. Book instantly on Krowned.",
    ...base,
  };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string; date?: string; time?: string }>;
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
          "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, latitude, longitude, primary_category_id, badges, service_categories(name, slug)",
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
    // Skip placeholder/test service names
    if (key.length < 3 || /^test/i.test(key)) continue;
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

  // Build a map of business_id → service names for search matching
  const bizServiceNames = new Map<string, string[]>();
  for (const s of services) {
    if (!bizServiceNames.has(s.business_id)) bizServiceNames.set(s.business_id, []);
    bizServiceNames.get(s.business_id)!.push(s.name);
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
      serviceNames: bizServiceNames.get(biz.id) ?? [],
      badges: Array.isArray(biz.badges) ? (biz.badges as string[]) : [],
    };
  });

  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    { name: "Explore", url: `${SITE_URL}/explore` },
  ];
  if (params.category) {
    const cat = categories.find((c) => c.slug === params.category);
    if (cat) {
      breadcrumbItems.push({
        name: cat.name,
        url: `${SITE_URL}/explore?category=${cat.slug}`,
      });
    }
  }

  return (
    <>
    <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
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

    {/* Find by specialty — internal links for SEO */}
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-lg font-bold text-foreground">Find by specialty</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_LANDINGS.map((landing) => {
            const topCities = Object.entries(CITY_PAGES).slice(0, 4);
            return (
              <div key={landing.slug}>
                <h3 className="text-sm font-semibold text-foreground capitalize">
                  {landing.plural}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {topCities.map(([citySlug, city]) => (
                    <li key={citySlug}>
                      <Link
                        href={`/${landing.slug}/${citySlug}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {city.name}, {city.region}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
