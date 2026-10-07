import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import { resolveCardImage } from "@/lib/explore/utils";
import {
  JsonLd,
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
} from "@/lib/schema";
import { StarRating } from "@/components/star-rating";
import { CITY_PAGES } from "@/lib/cities-data";
import {
  SERVICE_LANDINGS,
  getServiceLanding,
  getServiceLandingCities,
  interpolateFaqs,
} from "@/lib/service-landing-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";
const MIN_LISTINGS = 3;

export function generateStaticParams() {
  return getServiceLandingCities();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>;
}): Promise<Metadata> {
  const { service: serviceSlug, city: citySlug } = await params;
  const landing = getServiceLanding(serviceSlug);
  const cityPage = CITY_PAGES[citySlug];
  if (!landing || !cityPage) return { title: "Not Found" };

  const cityLabel = cityPage.name.includes(cityPage.region)
    ? cityPage.name
    : `${cityPage.name}, ${cityPage.region}`;
  const title = `${landing.plural.charAt(0).toUpperCase() + landing.plural.slice(1)} in ${cityLabel}`;
  const description = landing.metaDescriptionTemplate.replace(
    /\{city\}/g,
    cityLabel,
  );

  return {
    title,
    description: description.slice(0, 155),
    alternates: {
      canonical: `${SITE_URL}/${serviceSlug}/${citySlug}`,
    },
    openGraph: {
      title,
      description: description.slice(0, 155),
      url: `${SITE_URL}/${serviceSlug}/${citySlug}`,
      images: [
        { url: `${SITE_URL}/brand/hero-salon.png`, width: 1200, height: 630 },
      ],
    },
  };
}

export default async function ServiceCityLandingPage({
  params,
}: {
  params: Promise<{ service: string; city: string }>;
}) {
  const { service: serviceSlug, city: citySlug } = await params;
  const landing = getServiceLanding(serviceSlug);
  const cityPage = CITY_PAGES[citySlug];
  if (!landing || !cityPage) notFound();

  const supabase = await createClient();

  // Get category IDs for this service type
  const { data: cats } = await supabase
    .from("service_categories")
    .select("id, name, slug")
    .in("slug", landing.categorySlugs);

  const catIds = (cats ?? []).map((c) => c.id);
  if (catIds.length === 0) notFound();

  // Fetch businesses in this city AND category
  const [bizRes, reviewRes] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured",
      )
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .in("primary_category_id", catIds)
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

  const isThin = businesses.length < MIN_LISTINGS;
  const cityName = cityPage.name.includes(cityPage.region)
    ? cityPage.name
    : `${cityPage.name}, ${cityPage.region}`;
  const pluralCap =
    landing.plural.charAt(0).toUpperCase() + landing.plural.slice(1);

  const introText =
    businesses.length > 0
      ? `Browse ${businesses.length} verified ${landing.plural} in ${cityName}. Check real-time availability, compare reviews, and book your appointment online on Krowned.`
      : `No ${landing.plural} listed in ${cityName} yet. Check back soon or browse nearby cities.`;

  const faqs = interpolateFaqs(landing.faqs, cityName);

  // Nearby cities for this service
  const nearbyCities = Object.entries(CITY_PAGES)
    .filter(([s]) => s !== citySlug)
    .slice(0, 6);

  // Other service types for cross-linking
  const siblingServices = SERVICE_LANDINGS.filter(
    (s) => s.slug !== serviceSlug,
  );

  return (
    <div>
      {isThin && <meta name="robots" content="noindex, follow" />}

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Explore", url: `${SITE_URL}/explore` },
          {
            name: `${cityPage.name}, ${cityPage.region}`,
            url: `${SITE_URL}/explore/${citySlug}`,
          },
          {
            name: pluralCap,
            url: `${SITE_URL}/${serviceSlug}/${citySlug}`,
          },
        ])}
      />
      {businesses.length > 0 && (
        <JsonLd
          data={itemListSchema(
            businesses.map((biz, i) => ({
              name: biz.name,
              url: `${SITE_URL}/b/${biz.slug}`,
              position: i + 1,
            })),
          )}
        />
      )}
      {faqs.length > 0 && <JsonLd data={faqPageSchema(faqs)} />}

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
            {pluralCap} in {cityPage.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {introText}
          </p>
        </div>
      </section>

      {/* Stylist grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {pluralCap} in {cityPage.name}
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
              No {landing.plural} listed in {cityPage.name} yet.
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

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-border bg-card"
                >
                  <summary className="cursor-pointer px-5 py-4 font-medium text-foreground hover:text-primary transition-colors">
                    {faq.q}
                  </summary>
                  <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Same service in nearby cities */}
      {nearbyCities.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              {pluralCap} in nearby areas
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {nearbyCities.map(([slug, city]) => (
                <Link
                  key={slug}
                  href={`/${serviceSlug}/${slug}`}
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

      {/* Other service types in this city */}
      {siblingServices.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              More stylists in {cityPage.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {siblingServices.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}/${citySlug}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s.plural.charAt(0).toUpperCase() + s.plural.slice(1)}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">
          Find your {landing.singular} in {cityPage.name}
        </h2>
        <p className="mt-2 text-muted-foreground">
          See real-time availability on the map and book instantly.
        </p>
        <Link
          href={`/explore?city=${encodeURIComponent(cityPage.name)}&category=${landing.categorySlugs[0]}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Open map view <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
