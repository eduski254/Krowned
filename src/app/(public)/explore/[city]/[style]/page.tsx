import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import { resolveCardImage } from "@/lib/explore/utils";
import { JsonLd, breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { StarRating } from "@/components/star-rating";
import { CITY_PAGES } from "@/lib/cities-data";
import { getStylePage, STYLE_PAGES } from "@/lib/styles-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

/** Minimum listings to generate a page (below this → noindex) */
const MIN_LISTINGS = 3;

/**
 * Build static params for every city × style combo.
 * Pages below the listing threshold will be noindexed at render time.
 */
export function generateStaticParams() {
  const params: Array<{ city: string; style: string }> = [];
  for (const citySlug of Object.keys(CITY_PAGES)) {
    for (const s of STYLE_PAGES) {
      params.push({ city: citySlug, style: s.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; style: string }>;
}): Promise<Metadata> {
  const { city: citySlug, style: styleSlug } = await params;
  const cityPage = CITY_PAGES[citySlug];
  const stylePage = getStylePage(styleSlug);
  if (!cityPage || !stylePage) return { title: "Not Found" };

  const styleName = stylePage.h1.replace(" in the DMV", "");
  const title = `${styleName} in ${cityPage.name}, ${cityPage.region}`;
  const description = `Find ${styleName.toLowerCase()} stylists in ${cityPage.name}, ${cityPage.region}. Browse verified professionals, check real-time availability, and book on Krowned.`;

  return {
    title,
    description: description.slice(0, 155),
    alternates: {
      canonical: `${SITE_URL}/explore/${citySlug}/${styleSlug}`,
    },
    openGraph: {
      title: `${title} | Krowned`,
      description: description.slice(0, 155),
      url: `${SITE_URL}/explore/${citySlug}/${styleSlug}`,
      images: [{ url: `${SITE_URL}/brand/hero-salon.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function StyleCityPage({
  params,
}: {
  params: Promise<{ city: string; style: string }>;
}) {
  const { city: citySlug, style: styleSlug } = await params;
  const cityPage = CITY_PAGES[citySlug];
  const stylePage = getStylePage(styleSlug);
  if (!cityPage || !stylePage) notFound();

  const supabase = await createClient();

  // Get parent category
  const { data: cat } = await supabase
    .from("service_categories")
    .select("id, name, slug")
    .eq("slug", stylePage.categorySlug)
    .maybeSingle();

  if (!cat) notFound();

  // Fetch businesses in this city AND category
  const [bizRes, reviewRes] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured",
      )
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .eq("primary_category_id", cat.id)
      .in("city", cityPage.dbMatches)
      .order("is_featured", { ascending: false })
      .limit(60),
    supabase
      .from("reviews")
      .select("business_id, rating")
      .eq("status", "published"),
  ]);

  const businesses = bizRes.data ?? [];
  const reviews = reviewRes.data ?? [];

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

  const styleName = stylePage.h1.replace(" in the DMV", "");
  const isThin = businesses.length < MIN_LISTINGS;

  // Build an intro specific to this city
  const cityIntro =
    businesses.length > 0
      ? `Browse ${businesses.length} verified ${styleName.toLowerCase()} ${businesses.length === 1 ? "stylist" : "stylists"} in ${cityPage.name}, ${cityPage.region}. Check real-time availability and book your appointment on Krowned.`
      : `No ${styleName.toLowerCase()} stylists listed in ${cityPage.name} yet. Check back soon or browse nearby cities.`;

  // Nearby cities that have the same style category
  const nearbyCities = Object.entries(CITY_PAGES)
    .filter(([s]) => s !== citySlug)
    .slice(0, 6);

  // Sibling styles for this city
  const siblingStyles = STYLE_PAGES.filter((s) => s.slug !== styleSlug);

  return (
    <div>
      {/* noindex thin pages */}
      {isThin && (
        <meta name="robots" content="noindex, follow" />
      )}

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Explore", url: `${SITE_URL}/explore` },
          {
            name: `${cityPage.name}, ${cityPage.region}`,
            url: `${SITE_URL}/explore/${citySlug}`,
          },
          {
            name: styleName,
            url: `${SITE_URL}/explore/${citySlug}/${styleSlug}`,
          },
        ])}
      />
      {stylePage.faqs.length > 0 && (
        <JsonLd data={faqPageSchema(stylePage.faqs)} />
      )}

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
            <Link
              href={`/explore/${citySlug}`}
              className="hover:text-primary transition-colors"
            >
              {cityPage.name}, {cityPage.region}
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-heading sm:text-4xl text-foreground">
            {styleName} in {cityPage.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {cityIntro}
          </p>
        </div>
      </section>

      {/* Stylist grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {styleName} Stylists in {cityPage.name}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({businesses.length})
          </span>
        </h2>

        {businesses.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((biz) => {
              const stats = ratingMap.get(biz.id);
              const avg = stats ? stats.sum / stats.count : null;
              const imageUrl = resolveCardImage(biz);
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
                    {biz.city && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {biz.city}
                      </p>
                    )}
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
              No {styleName.toLowerCase()} stylists listed in {cityPage.name}{" "}
              yet.
            </p>
            <Link
              href={`/styles/${stylePage.categorySlug}/${styleSlug}`}
              className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse all {styleName.toLowerCase()} stylists
            </Link>
          </div>
        )}
      </section>

      {/* Other styles in this city */}
      {siblingStyles.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              More styles in {cityPage.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {siblingStyles.slice(0, 7).map((s) => (
                <Link
                  key={s.slug}
                  href={`/explore/${citySlug}/${s.slug}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s.h1.replace(" in the DMV", "")}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby cities */}
      {nearbyCities.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              {styleName} in nearby areas
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {nearbyCities.map(([slug, city]) => (
                <Link
                  key={slug}
                  href={`/explore/${slug}/${styleSlug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {city.name}, {city.region}
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
          Find your stylist in {cityPage.name}
        </h2>
        <p className="mt-2 text-muted-foreground">
          See real-time availability on the map and book instantly.
        </p>
        <Link
          href={`/explore?city=${encodeURIComponent(cityPage.name)}&category=${cat.slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Open map view <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
