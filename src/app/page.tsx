import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { HeroSearch } from "@/components/public/hero-search";
import { Star, Search, Calendar, CheckCircle, MapPin, ArrowRight } from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { resolveCardImage } from "@/lib/explore/utils";

// REVIEW: Replace with a real licensed image before launch.
// Swap this single constant to change the homepage hero background.
const HERO_BG_IMAGE =
  "https://images.unsplash.com/photo-1592647420148-bfcc177e2117?auto=format&fit=crop&w=1920&q=80";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch categories, businesses, services in parallel
  const [catRes, bizRes, svcRes] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name, slug, icon")
      .order("sort_order")
      .limit(8),
    supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, primary_category_id, service_categories(name, slug)",
      )
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .order("is_featured", { ascending: false })
      .limit(200),
    supabase
      .from("services")
      .select("name, business_id")
      .eq("is_active", true),
  ]);

  const categories = catRes.data ?? [];
  const businesses = bizRes.data ?? [];
  const services = svcRes.data ?? [];

  // Build search businesses for the hero dropdown
  const searchBusinesses = businesses.map((biz) => {
    const cat = biz.service_categories as unknown as { name: string; slug: string } | null;
    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      imageUrl: resolveCardImage(biz),
      categoryName: cat?.name ?? null,
      city: biz.city,
      avgRating: null as number | null,
    };
  });

  // Build service names with counts
  const publishedBizIds = new Set(businesses.map((b) => b.id));
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

  const topBusinesses = businesses.slice(0, 6);

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      {/* Hero — full viewport with background image + gradient overlay */}
      <section className="relative flex min-h-[85dvh] items-center justify-center overflow-hidden text-center sm:min-h-[100dvh]">
        {/* Background image */}
        <img
          src={HERO_BG_IMAGE}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Brand gradient overlay (~40% opacity — photo shows through) */}
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        {/* Extra scrim for text legibility */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 lg:py-14">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
            Beauty &amp; wellness, booked effortlessly
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/90 drop-shadow-sm sm:mt-6 sm:text-lg">
            Discover top professionals near you. Book in seconds. Grow your business with Zawadi.
          </p>

          {/* Hero search bar — Booksy-style with dropdowns */}
          <div className="mt-8 sm:mt-10">
            <HeroSearch
              businesses={searchBusinesses}
              serviceNames={serviceNames}
            />
          </div>
        </div>
      </section>

      {/* Categories grid */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Browse by Category
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Find exactly what you need
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.filter((cat) => cat.slug !== "new-category").map((cat) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                style={{ boxShadow: "rgba(0, 0, 0, 0.15) 0px 8px 20px 0px" }}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
              >
                {cat.icon && CATEGORY_ICONS[cat.icon] && (() => {
                  const Icon = CATEGORY_ICONS[cat.icon];
                  return <Icon className="h-8 w-8 mb-3 text-primary" />;
                })()}
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top professionals */}
      {topBusinesses && topBusinesses.length > 0 && (
        <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Top Professionals
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Trusted by thousands of happy clients
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topBusinesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/b/${biz.slug}`}
                  style={{ boxShadow: "rgba(0, 0, 0, 0.15) 0px 8px 20px 0px" }}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    {biz.logo_url ? (
                      <img
                        src={biz.logo_url}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                        {biz.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                          {biz.name}
                        </h3>
                        {biz.is_featured && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {[biz.city, biz.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View profile <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                View all professionals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          How Zawadi Works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { icon: Search, title: "Discover", desc: "Browse top-rated beauty and wellness professionals in your area." },
            { icon: Calendar, title: "Book", desc: "Choose your service, pick a time, and confirm in seconds." },
            { icon: CheckCircle, title: "Enjoy", desc: "Show up, relax, and enjoy your appointment. It's that easy." },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-hero px-4 py-16 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Are you a beauty professional?
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Join Zawadi and reach thousands of new clients. Manage bookings, staff, and payments all in one place.
          </p>
          <Link
            href="/for-professionals"
            className="mt-8 inline-block rounded-lg bg-background px-8 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
          >
            List Your Business
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          What Our Users Say
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { name: "Amani K.", text: "Found my new favorite hair stylist through Zawadi. The booking was so easy!", rating: 5 },
            { name: "Wanjiku M.", text: "As a salon owner, Zawadi has helped me fill empty slots and grow my client base.", rating: 5 },
            { name: "David O.", text: "Finally a platform that understands our market. Clean, fast, and reliable.", rating: 5 },
          ].map((t) => (
            <div key={t.name} style={{ boxShadow: "rgba(0, 0, 0, 0.15) 0px 8px 20px 0px" }} className="rounded-xl border border-border bg-card p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-foreground">&ldquo;{t.text}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
