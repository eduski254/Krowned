import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { resolveCardImage } from "@/lib/explore/utils";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { StarRating } from "@/components/star-rating";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

const STYLE_SEO: Record<
  string,
  { h1: string; intro: string; keywords: string[] }
> = {
  "braids-protective": {
    h1: "Braids & Protective Styles",
    intro:
      "Knotless braids, box braids, feed-ins, cornrows, Fulani braids, goddess locs, and more. Browse verified braiders across the DMV who specialize in protective styles that last weeks and keep your hair healthy.",
    keywords: [
      "Knotless Braids",
      "Box Braids",
      "Feed-in Braids",
      "Cornrows",
      "Fulani Braids",
      "Goddess Locs",
      "Passion Twists",
      "Tribal Braids",
    ],
  },
  locs: {
    h1: "Locs & Loc Maintenance",
    intro:
      "Starter locs, retwists, interlocks, loc repairs, faux locs, and loc styling. Find experienced locticians in DC, Maryland, and Northern Virginia who understand every stage of the loc journey.",
    keywords: [
      "Starter Locs",
      "Retwist",
      "Interlocks",
      "Loc Repair",
      "Faux Locs",
      "Loc Styling",
      "Butterfly Locs",
      "Soft Locs",
    ],
  },
  "natural-silk-press": {
    h1: "Natural Hair & Silk Press",
    intro:
      "Wash-and-go, twist-outs, rod sets, silk press, blowouts, and natural hair treatments. Connect with stylists who celebrate and understand natural texture — from 3A waves to 4C coils.",
    keywords: [
      "Silk Press",
      "Wash and Go",
      "Twist Out",
      "Rod Set",
      "Blowout",
      "Natural Hair Treatment",
      "Deep Conditioning",
      "Trim & Shape",
    ],
  },
  "weaves-extensions": {
    h1: "Weaves & Extensions",
    intro:
      "Sew-ins, closures, frontals, tape-ins, clip-ins, and wig installs. Find extension specialists in the DMV who deliver seamless, natural-looking results every time.",
    keywords: [
      "Sew-in Weave",
      "Lace Closure",
      "Lace Frontal",
      "Tape-in Extensions",
      "Clip-in Extensions",
      "Wig Install",
      "Quick Weave",
      "Ponytail",
    ],
  },
  "barbering-cuts": {
    h1: "Barbering & Cuts",
    intro:
      "Fades, tapers, line-ups, beard trims, razor parts, and precision cuts for all textures. Find barbers across DC, Maryland, and Virginia who keep your cut sharp every time.",
    keywords: [
      "Fade",
      "Taper",
      "Line-up",
      "Beard Trim",
      "Razor Part",
      "Buzz Cut",
      "Mohawk",
      "Design Cut",
    ],
  },
  color: {
    h1: "Color & Highlights",
    intro:
      "Full color, highlights, balayage on natural hair, loc color, bleach and tone, and vivid fashion colors. Find colorists in the DMV who know how to protect textured hair while delivering bold or subtle results.",
    keywords: [
      "Highlights",
      "Full Color",
      "Balayage",
      "Loc Color",
      "Bleach & Tone",
      "Vivid Color",
      "Color Correction",
      "Gloss Treatment",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("service_categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  if (!cat) return { title: "Style Not Found" };

  const seo = STYLE_SEO[slug];
  const title = seo?.h1 || cat.name;

  return {
    title: `${title} — Stylists in the DMV`,
    description:
      seo?.intro?.slice(0, 155) ||
      `Find and book ${cat.name.toLowerCase()} stylists in DC, Maryland, and Northern Virginia on Krowned.`,
    openGraph: {
      title: `${title} — Book on Krowned`,
      description: `Browse verified ${cat.name.toLowerCase()} specialists in the DMV.`,
    },
  };
}

export default async function StyleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("service_categories")
    .select("id, name, slug, icon")
    .eq("slug", slug)
    .maybeSingle();

  if (!cat) notFound();

  // Fetch businesses in this category with reviews
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
      .limit(50),
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

  const seo = STYLE_SEO[slug];
  const Icon = cat.icon ? CATEGORY_ICONS[cat.icon] : null;

  return (
    <div>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Styles", url: `${SITE_URL}/styles` },
          { name: cat.name, url: `${SITE_URL}/styles/${cat.slug}` },
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center text-white">
        <Image
          src="/brand/bg-hero.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          {Icon && (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <Icon className="h-7 w-7 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold sm:text-4xl">
            {seo?.h1 || cat.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
            {seo?.intro ||
              `Find verified ${cat.name.toLowerCase()} stylists in the DMV.`}
          </p>
        </div>
      </section>

      {/* Popular search terms / keywords */}
      {seo?.keywords && seo.keywords.length > 0 && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="flex flex-wrap justify-center gap-2">
              {seo.keywords.map((kw) => (
                <Link
                  key={kw}
                  href={`/explore?q=${encodeURIComponent(kw)}&category=${cat.slug}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stylist grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {cat.name} Stylists
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
              No {cat.name.toLowerCase()} stylists listed yet. Check back soon
              or browse all stylists.
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

      {/* CTA */}
      <section className="border-t border-border px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">
          Ready to book your {cat.name.toLowerCase()} appointment?
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
