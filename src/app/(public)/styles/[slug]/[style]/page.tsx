import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { resolveCardImage } from "@/lib/explore/utils";
import {
  JsonLd,
  breadcrumbSchema,
  faqPageSchema,
} from "@/lib/schema";
import { StarRating } from "@/components/star-rating";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import {
  getAllStyleParams,
  getStylePage,
  getStylesForCategory,
} from "@/lib/styles-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

const CITY_PAGES: Record<string, { name: string; region: string }> = {
  "washington-dc": { name: "Washington, DC", region: "DC" },
  "silver-spring-md": { name: "Silver Spring", region: "MD" },
  "bowie-md": { name: "Bowie", region: "MD" },
  "hyattsville-md": { name: "Hyattsville", region: "MD" },
  "largo-md": { name: "Largo", region: "MD" },
  "bethesda-md": { name: "Bethesda", region: "MD" },
  "alexandria-va": { name: "Alexandria", region: "VA" },
  "arlington-va": { name: "Arlington", region: "VA" },
  "fairfax-va": { name: "Fairfax", region: "VA" },
};

export function generateStaticParams() {
  return getAllStyleParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; style: string }>;
}): Promise<Metadata> {
  const { slug, style: styleSlug } = await params;
  const stylePage = getStylePage(styleSlug);
  if (!stylePage || stylePage.categorySlug !== slug) {
    return { title: "Style Not Found" };
  }

  return {
    title: stylePage.metaTitle,
    description: stylePage.intro.slice(0, 155),
    alternates: {
      canonical: `${SITE_URL}/styles/${slug}/${styleSlug}`,
    },
    openGraph: {
      title: stylePage.metaTitle,
      description: stylePage.intro.slice(0, 155),
      url: `${SITE_URL}/styles/${slug}/${styleSlug}`,
      images: [{ url: `${SITE_URL}/brand/hero-salon.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function StyleSubPage({
  params,
}: {
  params: Promise<{ slug: string; style: string }>;
}) {
  const { slug, style: styleSlug } = await params;
  const stylePage = getStylePage(styleSlug);
  if (!stylePage || stylePage.categorySlug !== slug) notFound();

  const supabase = await createClient();

  // Get parent category
  const { data: cat } = await supabase
    .from("service_categories")
    .select("id, name, slug, icon")
    .eq("slug", slug)
    .maybeSingle();

  if (!cat) notFound();

  // Fetch businesses in this category + reviews
  const [bizRes, reviewRes] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured",
      )
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .eq("primary_category_id", cat.id)
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

  // Sibling styles in same category (for internal linking)
  const siblings = getStylesForCategory(slug).filter(
    (s) => s.slug !== styleSlug,
  );

  const Icon = cat.icon ? CATEGORY_ICONS[cat.icon] : null;

  return (
    <div>
      {/* JSON-LD */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Styles", url: `${SITE_URL}/styles` },
          { name: cat.name, url: `${SITE_URL}/styles/${cat.slug}` },
          {
            name: stylePage.h1.replace(" in the DMV", ""),
            url: `${SITE_URL}/styles/${slug}/${styleSlug}`,
          },
        ])}
      />
      <JsonLd data={faqPageSchema(stylePage.faqs)} />

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
          {Icon && (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/10">
              <Icon className="h-7 w-7 text-foreground" />
            </div>
          )}
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            <Link
              href={`/styles/${cat.slug}`}
              className="hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
          </p>
          <h1 className="text-3xl font-bold font-heading sm:text-4xl text-foreground">
            {stylePage.h1}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {stylePage.intro}
          </p>
        </div>
      </section>

      {/* Size / length guide */}
      {stylePage.sizeGuide && stylePage.sizeGuide.length > 0 && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Size &amp; Length Guide
            </h2>
            <div className="mt-6 space-y-4">
              {stylePage.sizeGuide.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <h3 className="font-semibold text-foreground">{row.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stylist grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {stylePage.h1.replace(" in the DMV", "")} Stylists
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
              No stylists listed yet. Check back soon or browse all stylists.
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

      {/* Browse by city */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-bold text-foreground">Browse by city</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(CITY_PAGES).map(([citySlug, city]) => (
              <Link
                key={citySlug}
                href={`/explore/${citySlug}`}
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

      {/* FAQs */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 space-y-4">
            {stylePage.faqs.map((faq) => (
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

      {/* Related styles */}
      {siblings.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              More {cat.name} styles
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/styles/${s.categorySlug}/${s.slug}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s.h1.replace(" in the DMV", "")}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">
          Ready to book?
        </h2>
        <p className="mt-2 text-muted-foreground">
          See real-time availability and book instantly.
        </p>
        <Link
          href={`/explore?category=${cat.slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          View on map <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
