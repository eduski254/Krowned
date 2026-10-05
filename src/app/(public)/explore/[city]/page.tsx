import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import { resolveCardImage } from "@/lib/explore/utils";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { StarRating } from "@/components/star-rating";
import { CITY_PAGES, CITY_SLUGS } from "@/lib/cities-data";
import { STYLE_PAGES } from "@/lib/styles-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

/** Used by Next.js to pre-render all city pages at build time */
export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const page = CITY_PAGES[slug];
  if (!page) return { title: "Area Not Found" };

  const title = `Braiders, Loc Techs & Stylists in ${page.name}, ${page.region}`;

  // Noindex cities with no listings to avoid thin-content penalties
  const THIN_CITIES = new Set(["bethesda-md", "fairfax-va"]);
  const robots = THIN_CITIES.has(slug)
    ? { index: false, follow: true }
    : undefined;

  return {
    title,
    description: page.intro.slice(0, 155),
    ...(robots && { robots }),
    alternates: {
      canonical: `${SITE_URL}/explore/${slug}`,
    },
    openGraph: {
      title,
      description: `Find and book textured-hair stylists in ${page.name}. Verified professionals, real availability.`,
      url: `${SITE_URL}/explore/${slug}`,
      images: [{ url: `${SITE_URL}/brand/hero-salon.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function CityExplorePage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const page = CITY_PAGES[slug];
  if (!page) notFound();

  const supabase = await createClient();

  // Fetch businesses + reviews
  const [bizRes, reviewRes, catRes] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, primary_category_id, service_categories(name, slug)",
      )
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .in("city", page.dbMatches)
      .order("is_featured", { ascending: false })
      .limit(100),
    supabase
      .from("reviews")
      .select("business_id, rating")
      .eq("status", "published"),
    supabase
      .from("service_categories")
      .select("id, name, slug")
      .order("sort_order"),
  ]);

  const businesses = bizRes.data ?? [];
  const reviews = reviewRes.data ?? [];
  const categories = catRes.data ?? [];

  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const existing = ratingMap.get(r.business_id);
    if (existing) {
      existing.sum += r.rating;
      existing.count++;
    } else {
      ratingMap.set(r.business_id, { sum: r.rating, count: 1 });
    }
  }

  // Group by category for display
  const bizByCategory = new Map<string, typeof businesses>();
  for (const biz of businesses) {
    const cat = biz.service_categories as unknown as {
      name: string;
      slug: string;
    } | null;
    const key = cat?.name ?? "Other";
    if (!bizByCategory.has(key)) bizByCategory.set(key, []);
    bizByCategory.get(key)!.push(biz);
  }

  // Nearby cities for internal linking
  const nearbyCities = Object.entries(CITY_PAGES)
    .filter(([s]) => s !== slug)
    .slice(0, 6);

  return (
    <div>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Explore", url: `${SITE_URL}/explore` },
          {
            name: `${page.name}, ${page.region}`,
            url: `${SITE_URL}/explore/${slug}`,
          },
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center">
        <Image
          src="/brand/bg-texture.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/50 dark:bg-background/70" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {page.region}
          </div>
          <h1 className="text-3xl font-bold font-heading sm:text-4xl text-foreground">
            Textured-Hair Stylists in {page.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {page.intro}
          </p>
        </div>
      </section>

      {/* Quick category links */}
      {categories.length > 0 && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <div className="flex flex-wrap justify-center gap-2">
              {categories
                .filter((c) => c.slug !== "new-category")
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/explore?category=${c.slug}&city=${encodeURIComponent(page.name)}`}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Stylist listings */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {businesses.length}{" "}
          {businesses.length === 1 ? "stylist" : "stylists"} in {page.name}
        </h2>

        {businesses.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((biz) => {
              const stats = ratingMap.get(biz.id);
              const avg = stats ? stats.sum / stats.count : null;
              const imageUrl = resolveCardImage(biz);
              const cat = biz.service_categories as unknown as {
                name: string;
              } | null;
              return (
                <Link
                  key={biz.id}
                  href={`/b/${biz.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={biz.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
                        {biz.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {biz.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {cat?.name && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {cat.name}
                        </span>
                      )}
                      {biz.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {biz.city}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <StarRating
                        value={avg}
                        count={stats?.count ?? 0}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No stylists listed in {page.name} yet. Check back soon or browse
              all DMV stylists.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse all stylists
            </Link>
          </div>
        )}
      </section>

      {/* Browse by style */}
      {STYLE_PAGES.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              Browse styles in {page.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {STYLE_PAGES.map((s) => (
                <Link
                  key={s.slug}
                  href={`/explore/${slug}/${s.slug}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s.h1.replace(" in the DMV", "")}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby areas */}
      {nearbyCities.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              Also serving nearby areas
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {nearbyCities.map(([citySlug, cityPage]) => (
                <Link
                  key={citySlug}
                  href={`/explore/${citySlug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {cityPage.name}, {cityPage.region}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">
          Find your stylist in {page.name}
        </h2>
        <p className="mt-2 text-muted-foreground">
          See real-time availability on the map and book instantly.
        </p>
        <Link
          href={`/explore?city=${encodeURIComponent(page.name)}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Open map view <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
