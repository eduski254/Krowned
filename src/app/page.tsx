import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { HeroSearch } from "@/components/public/hero-search";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Star,
  CreditCard,
  Clock,
  Sparkles,
  Users,
  MapPin,
  BadgeCheck,
  Check,
  X,
  Zap,
  Crown,
  Building2,
} from "lucide-react";
import { TestimonialsCarousel } from "@/components/public/testimonials-carousel";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { resolveCardImage } from "@/lib/explore/utils";
import { FeaturedCarousel } from "@/components/public/featured-carousel";
import { JsonLd, organizationSchema, webSiteSchema } from "@/lib/schema";
import { RotatingService } from "@/components/public/rotating-service";

/** Revalidate homepage every hour (ISR) */
export const revalidate = 3600;

const HERO_BG_IMAGE = "/brand/hero-salon.png";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Krowned — Book Braids, Locs & Textured Hair in the DMV",
  description:
    "Find and book braiders, loc techs, and textured-hair stylists in DC, Maryland, and Northern Virginia. Knotless braids, retwists, silk press, sew-ins, fades — your crown, booked.",
  openGraph: {
    title: "Krowned — Book Braids, Locs & Textured Hair in the DMV",
    description:
      "Find and book braiders, loc techs, and textured-hair stylists in DC, Maryland, and Northern Virginia.",
  },
};

function isBusinessOpen(
  hours: { day_of_week: number; open_time: string | null; close_time: string | null }[],
  timezone: string,
): boolean | null {
  if (!hours || hours.length === 0) return null;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const dayName = parts.find((p) => p.type === "weekday")?.value ?? "";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[dayName] ?? now.getDay();
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const currentTime = `${hour}:${minute}`;

  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek);
  if (!todayHours || !todayHours.open_time || !todayHours.close_time) return false;
  return currentTime >= todayHours.open_time && currentTime < todayHours.close_time;
}

export default async function HomePage() {
  const supabase = await createClient();

  const [catRes, bizRes, svcRes, blogRes] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name, slug, icon")
      .order("sort_order")
      .limit(8),
    supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, created_at, timezone, primary_category_id, service_categories(name, slug), business_hours(day_of_week, open_time, close_time)",
      )
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .order("is_featured", { ascending: false })
      .limit(200),
    supabase.from("services").select("name, business_id").eq("is_active", true),
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  const categories = catRes.data ?? [];
  const businesses = bizRes.data ?? [];
  const services = svcRes.data ?? [];
  const blogPosts = blogRes.data ?? [];

  const searchBusinesses = businesses.map((biz) => {
    const cat = biz.service_categories as unknown as {
      name: string;
      slug: string;
    } | null;
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

  const featuredBusinesses = businesses.filter((b) => b.is_featured);

  // Find the top city for "Featured in" section
  const DMV_STATES: Record<string, string> = {
    "Washington": "DC",
    "Silver Spring": "MD",
    "Bethesda": "MD",
    "Baltimore": "MD",
    "Bowie": "MD",
    "Largo": "MD",
    "Hyattsville": "MD",
    "College Park": "MD",
    "Greenbelt": "MD",
    "Rockville": "MD",
    "Germantown": "MD",
    "Gaithersburg": "MD",
    "Laurel": "MD",
    "Columbia": "MD",
    "Annapolis": "MD",
    "Arlington": "VA",
    "Alexandria": "VA",
    "Fairfax": "VA",
    "Reston": "VA",
    "Tysons": "VA",
    "McLean": "VA",
    "Manassas": "VA",
  };
  const cityCount = new Map<string, number>();
  for (const b of businesses) {
    if (b.city) cityCount.set(b.city, (cityCount.get(b.city) ?? 0) + 1);
  }
  const topCity = Array.from(cityCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Washington";
  const topCityState = DMV_STATES[topCity] ?? "DC";
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const featuredInCity = businesses
    .filter((b) => b.city === topCity)
    .slice(0, 12);

  return (
    <div className="flex min-h-full flex-col">
      <JsonLd data={organizationSchema()} />
      <JsonLd data={webSiteSchema()} />
      <PublicHeader />

      {/* Hero — Full-bleed BG with left fade */}
      <section className="relative min-h-[100svh] overflow-hidden bg-[#0C0B0A] sm:min-h-[calc(100svh-57px)]">
        {/* Background image — spans entire hero */}
        <Image
          src={HERO_BG_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_bottom] sm:object-[65%_center] lg:object-right"
        />

        {/* Gradient overlays */}
        {/* Mobile/Tablet: heavier overlay so text is always readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0C0B0A]/80 via-[#0C0B0A]/50 to-[#0C0B0A] lg:hidden" />
        {/* Desktop: solid left → transparent right blend */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,#0C0B0A_0%,#0C0B0A_30%,rgba(12,11,10,0.85)_42%,rgba(12,11,10,0.4)_58%,transparent_75%)]" />
        {/* Subtle bottom fade on desktop too */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block bg-gradient-to-t from-[#0C0B0A]/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex min-h-[100svh] flex-col sm:min-h-[calc(100svh-57px)]">
          <div className="flex flex-1 flex-col justify-center px-4 pb-6 pt-20 sm:px-8 sm:py-16 md:px-10 lg:max-w-[55%] lg:px-[clamp(28px,4.2vw,60px)] lg:py-[clamp(32px,3.6vw,56px)]">
            <div className="mx-auto max-w-[600px] lg:mx-0">
              {/* Eyebrow */}
              <span className="mb-5 inline-flex items-center text-[10px] font-medium uppercase tracking-[0.22em] text-[#D9B36C] sm:mb-8 sm:text-sm lg:mb-9">
                DMV textured-hair pros
              </span>

              <div className="font-heading text-[clamp(28px,7vw,42px)] font-extrabold leading-[1.4] tracking-tight text-[#FBF6EC] sm:text-[clamp(40px,6vw,56px)] lg:text-[clamp(48px,5vw,76px)]" role="heading" aria-level={1}>
                <span className="block">Book your next</span>
                <span className="block h-[1.3em] overflow-hidden whitespace-nowrap text-[0.65em] sm:text-[0.8em] lg:text-[0.85em]">
                  <RotatingService className="text-[#E4C783]" />
                </span>
              </div>

              <p className="mt-4 max-w-[520px] text-[13px] font-light leading-relaxed text-[#F2E7D3]/60 sm:mt-6 sm:text-[15px] lg:mt-7 lg:text-[clamp(15px,1.2vw,17px)]">
                Every stylist specializes in textured hair. Find yours, see real
                openings, and book in seconds — no DMs, no ghosting.
              </p>

              <div className="mt-5 sm:mt-8 lg:mt-9">
                <HeroSearch
                  businesses={searchBusinesses}
                  serviceNames={serviceNames}
                  variant="card"
                />
              </div>
            </div>
          </div>

          {/* Trust bar — pinned to bottom */}
          <div className="mx-3 mb-3 flex items-center justify-center gap-3 rounded-xl border border-[#D9B36C]/25 bg-[#0C0B0A]/60 px-3 py-2 backdrop-blur-md sm:mx-6 sm:mb-6 sm:gap-5 sm:rounded-2xl sm:px-5 sm:py-3 lg:mx-8 lg:mb-8 lg:gap-6 lg:py-4 max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto max-sm:scrollbar-hide">
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#F2E7D3]/85 sm:gap-2 sm:text-[13px]">
              <BadgeCheck className="h-3 w-3 text-[#E4C783] sm:h-4 sm:w-4" /> ID-verified
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#F2E7D3]/85 sm:gap-2 sm:text-[13px]">
              <Shield className="h-3 w-3 text-[#E4C783] sm:h-4 sm:w-4" /> Secure payments
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#F2E7D3]/85 sm:gap-2 sm:text-[13px]">
              <Clock className="h-3 w-3 text-[#E4C783] sm:h-4 sm:w-4" /> Instant confirm
            </span>
          </div>
        </div>
      </section>

      {/* CTA1 — Client Section */}
      <section className="w-full bg-[#FBF6EC] dark:bg-[#141210]">
        <div className="grid items-center gap-10 px-5 py-20 sm:px-8 md:gap-14 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-28">
          {/* Text — left */}
          <div>
            <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight text-[#1A1816] dark:text-[#FBF6EC] sm:text-3xl lg:text-[clamp(30px,2.8vw,40px)]">
              Find your stylist.<br />Book your crown.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#4A4540] dark:text-[#C8BFAD] sm:text-base lg:text-[17px]">
              Stop scrolling through Instagram and waiting for a reply. Krowned
              helps you discover trusted stylists who specialize in textured
              hair, see their work, check real availability, and book your
              appointment in seconds.
            </p>

            <div className="mt-8 space-y-5">
              {[
                {
                  title: "Find your specialty",
                  desc: "Braids, locs, fades, silk presses, twists, and more.",
                },
                {
                  title: "See their work",
                  desc: "Explore styles, profiles, and verified reviews before you book.",
                },
                {
                  title: "Book with confidence",
                  desc: "Real availability means no more \"Are you free this weekend?\" DMs.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9B36C]/20">
                    <CheckCircle className="h-3.5 w-3.5 text-[#B8943F]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1816] dark:text-[#FBF6EC]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[#6B6560] dark:text-[#A89E8E]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Find a stylist <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Image — right */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:rounded-3xl">
            <Image
              src="/brand/cta-client.jpeg"
              alt="Client getting her textured hair styled at a Krowned salon"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA2 — Stylist Section */}
      <section className="w-full bg-[#F5EFE3] dark:bg-[#11100E]">
        <div className="grid items-center gap-10 px-5 py-20 sm:px-8 md:gap-14 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-28">
          {/* Image — left (on desktop, stacks below text on mobile via order) */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:rounded-3xl order-2 lg:order-1">
            <Image
              src="/brand/cta-stylist.jpeg"
              alt="Stylist managing her bookings on a tablet at a Krowned salon"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
              className="object-cover"
            />
          </div>

          {/* Text — right */}
          <div className="order-1 lg:order-2">
            <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight text-[#1A1816] dark:text-[#FBF6EC] sm:text-3xl lg:text-[clamp(30px,2.8vw,40px)]">
              Turn your talent into<br />a booked business.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#4A4540] dark:text-[#C8BFAD] sm:text-base lg:text-[17px]">
              Krowned puts your work in front of people actively looking for
              textured-hair specialists. Showcase your craft, control your
              availability, manage your bookings, and build a reputation clients
              can trust — all in one place.
            </p>

            <div className="mt-8 space-y-5">
              {[
                {
                  title: "Get discovered",
                  desc: "Put your work in front of clients searching for what you do best.",
                },
                {
                  title: "Own your schedule",
                  desc: "Set your availability and let clients book when it works for you.",
                },
                {
                  title: "Build your reputation",
                  desc: "Grow your profile with verified reviews and real client experiences.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9B36C]/20">
                    <CheckCircle className="h-3.5 w-3.5 text-[#B8943F]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1816] dark:text-[#FBF6EC]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[#6B6560] dark:text-[#A89E8E]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9">
              <Link
                href="/for-stylists"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Join Krowned <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured in [City] */}
      {featuredInCity.length > 0 && (
        <section className="w-full border-b border-border px-5 py-16 sm:px-8 lg:px-12">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Featured in {topCity}, {topCityState}
              </h2>
              <Link
                href={`/explore?city=${encodeURIComponent(topCity)}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featuredInCity.map((biz) => {
                const cat = biz.service_categories as unknown as {
                  name: string;
                  slug: string;
                } | null;
                const hours = (biz.business_hours ?? []) as { day_of_week: number; open_time: string | null; close_time: string | null }[];
                const isNew = biz.created_at >= oneWeekAgo;
                const openStatus = isBusinessOpen(hours, biz.timezone ?? "America/New_York");
                return (
                  <Link
                    key={biz.id}
                    href={`/b/${biz.slug}`}
                    className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {resolveCardImage(biz) ? (
                        <Image
                          src={resolveCardImage(biz)!}
                          alt={biz.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          loading="lazy"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                          {biz.name.charAt(0)}
                        </div>
                      )}
                      {/* Top-left badges */}
                      <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
                        {biz.is_featured && (
                          <span className="rounded-full bg-[#D9B36C] px-2.5 py-0.5 text-[11px] font-bold text-[#1A1816] shadow">
                            Featured
                          </span>
                        )}
                        {isNew && (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow">
                            New
                          </span>
                        )}
                      </div>
                      {/* Open/Closed badge — top right */}
                      {openStatus !== null && (
                        <span className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow ${
                          openStatus
                            ? "bg-emerald-500 text-white"
                            : "bg-[#1A1816] text-white"
                        }`}>
                          {openStatus ? "Open Now" : "Closed"}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-1">
                        {biz.name}
                      </h3>
                      {cat?.name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {cat.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground/70 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {biz.city}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Style */}
      {categories && categories.length > 0 && (
        <section className="w-full border-b border-border bg-muted/30 px-5 py-16 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Browse by Style
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Whatever your texture needs, we got you.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories
                .filter((cat) => cat.slug !== "new-category")
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/styles/${cat.slug}`}
                    style={{
                      boxShadow: "rgba(0, 0, 0, 0.15) 0px 8px 20px 0px",
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
                  >
                    {cat.icon &&
                      CATEGORY_ICONS[cat.icon] &&
                      (() => {
                        const Icon = CATEGORY_ICONS[cat.icon];
                        return (
                          <Icon className="mb-3 h-8 w-8 text-primary" />
                        );
                      })()}
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {cat.name}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      Explore <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Krowned */}
      <section className="w-full border-b border-border px-5 py-16 sm:px-8 lg:px-12">
        <div>
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Booking that finally gets your hair.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            We built the booking platform that textured hair actually deserves.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
{
                icon: BadgeCheck,
                title: "Every Stylist Verified",
                desc: "No fake pages or dead accounts. Every business on Krowned is verified with real work, real reviews, and a real booking system.",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                desc: "Pay online through Stripe — your card info never touches the stylist. Deposits protect against no-shows. Tips go 100% to your stylist.",
              },
              {
                icon: Star,
                title: "Honest Reviews",
                desc: "Only clients who actually booked and showed up can leave reviews. No spam, no bought ratings — just real feedback from real crowns.",
              },
              {
                icon: Clock,
                title: "Real-Time Availability",
                desc: "See actual open slots, not a generic contact form. Book the exact time that works for you — confirmed instantly.",
              },
              {
                icon: CreditCard,
                title: "No Subscription for Clients",
                desc: "Krowned is 100% free for clients. No sign-up fees, no booking fees, no hidden charges. Just find your stylist and book.",
              },
              {
                icon: Users,
                title: "Built for Our Community",
                desc: "Made by and for the textured-hair community — braids, locs, naturals, weaves, and cuts, all celebrated, none an afterthought.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stylists */}
      {featuredBusinesses.length > 0 && (
        <section className="w-full border-b border-border bg-muted/30 px-5 py-16 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Featured Stylists
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              The DMV&apos;s finest braiders, loc techs, and barbers.
            </p>
            <div className="mt-10">
              <FeaturedCarousel
                businesses={featuredBusinesses.map((biz) => {
                  const cat = biz.service_categories as unknown as {
                    name: string;
                    slug: string;
                  } | null;
                  return {
                    id: biz.id,
                    name: biz.name,
                    slug: biz.slug,
                    imageUrl: resolveCardImage(biz),
                    categoryName: cat?.name ?? null,
                    city: biz.city,
                    country: biz.country,
                  };
                })}
              />
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                View all stylists <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Popular Services */}
      {serviceNames.length > 0 && (
        <section className="w-full border-b border-border px-5 py-16 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Popular Services
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              The most-booked styles across the DMV right now.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {serviceNames.slice(0, 16).map((svc) => (
                <Link
                  key={svc.name}
                  href={`/explore?q=${encodeURIComponent(svc.name)}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5"
                >
                  {svc.name}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    {svc.count} {svc.count === 1 ? "stylist" : "stylists"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="w-full border-b border-border bg-muted/30 px-5 py-16 sm:px-8 lg:px-12">
        <div>
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Three steps. No DMs. No drama.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                image: "/brand/step-1.jpeg",
                alt: "Client browsing textured-hair stylists on her phone",
                title: "Find your stylist",
                desc: "Browse braiders, loc techs, and natural-hair pros across the DMV. Filter by style, location, and availability.",
              },
              {
                step: "2",
                image: "/brand/step-2.jpeg",
                alt: "Stylist booking calendar showing available appointment slots",
                title: "Book your seat",
                desc: "Pick your service, choose a time, lock it in. No DMs. No back-and-forth. Confirmed instantly.",
              },
              {
                step: "3",
                image: "/brand/step-3.jpeg",
                alt: "Client with freshly styled textured hair feeling confident",
                title: "Get crowned",
                desc: "Show up, sit back, leave feeling like royalty. Pay online or in the chair — tip your stylist right from the app.",
              },
            ].map((item) => (
              <div key={item.title} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                    {item.step}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Find your stylist <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="w-full border-b border-border px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            14-day free trial on all paid plans. No credit card required.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <HomePlanCard
              name="Free"
              price={0}
              period="forever"
              description="Get discovered"
              features={[
                { text: "Directory listing", included: true },
                { text: "Basic profile", included: true },
                { text: "Discoverable in search", included: true },
                { text: "Booking engine", included: false },
                { text: "Online payments", included: false },
                { text: "Staff management", included: false },
              ]}
              cta="Get started"
              ctaHref="/signup?type=professional"
              variant="default"
            />

            <HomePlanCard
              name="Starter"
              price={15}
              period="/seat/mo"
              description="For solo stylists"
              icon={<Zap className="h-5 w-5" />}
              features={[
                { text: "Everything in Free", included: true },
                { text: "Full booking engine", included: true },
                { text: "Online payments + tips", included: true },
                { text: "Shareable booking link", included: true },
                { text: "1 staff seat", included: true },
                { text: "Up to 5 services", included: true },
              ]}
              cta="Start free trial"
              ctaHref="/signup?type=professional"
              variant="default"
            />

            <HomePlanCard
              name="Pro"
              price={25}
              period="/seat/mo"
              description="For growing teams"
              icon={<Crown className="h-5 w-5" />}
              badge="Most popular"
              features={[
                { text: "Everything in Starter", included: true },
                { text: "Up to 10 staff seats", included: true },
                { text: "Unlimited services", included: true },
                { text: "In-app messaging", included: true },
                { text: "Analytics & earnings", included: true },
                { text: "Priority support", included: true },
              ]}
              cta="Start free trial"
              ctaHref="/signup?type=professional"
              variant="primary"
            />

            <HomePlanCard
              name="Enterprise"
              price={49}
              period="/seat/mo"
              description="For large studios"
              icon={<Building2 className="h-5 w-5" />}
              features={[
                { text: "Everything in Pro", included: true },
                { text: "Unlimited staff seats", included: true },
                { text: "Featured placement", included: true },
                { text: "Dedicated support", included: true },
                { text: "Custom branding", included: true },
                { text: "Advanced analytics", included: true },
              ]}
              cta="Start free trial"
              ctaHref="/signup?type=professional"
              variant="default"
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/for-stylists"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Compare all features <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full border-b border-border px-5 py-16 sm:px-8 lg:px-12">
        <div>
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            What People Are Saying
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Real clients, real stylists, real experiences.
          </p>
          <div className="mt-10">
            <TestimonialsCarousel
            testimonials={[
              {
                name: "Jasmine T.",
                text: "Finally found a braider through Krowned in like two minutes. Knotless came out perfect. No more scrolling IG for hours.",
                rating: 5,
              },
              {
                name: "Marcus W.",
                text: "I run a barbershop in Bowie. Krowned fills my empty slots without me posting on IG every day. Real talk.",
                rating: 5,
              },
              {
                name: "Aisha R.",
                text: "No more screenshots and CashApp deposits. My clients book and pay online. I can actually plan my week.",
                rating: 5,
              },
              {
                name: "Tiana M.",
                text: "My loc retwist used to take three weeks of back-and-forth DMs to schedule. Booked it in 30 seconds on Krowned.",
                rating: 5,
              },
              {
                name: "DeAndre J.",
                text: "Got a fresh taper and lineup for my interview. Found the barber, booked same-day. Clean.",
                rating: 5,
              },
              {
                name: "Nia K.",
                text: "I drive from Arlington to Silver Spring for my braider. Having her schedule online saves me so much time.",
                rating: 5,
              },
              {
                name: "Crystal P.",
                text: "Silk press came out gorgeous. Left a review right after so other naturals can find her too.",
                rating: 5,
              },
              {
                name: "Dominique R.",
                text: "The deposit system is clutch. No more people ghosting on my 6-hour braiding appointments.",
                rating: 5,
              },
              {
                name: "Kev B.",
                text: "My barbershop in Hyattsville is fully booked most weeks now. Krowned brought in clients I never would have reached.",
                rating: 5,
              },
              {
                name: "Simone L.",
                text: "Booked a sew-in with closure for my birthday. Stylist was verified, portfolio was fire, everything was smooth.",
                rating: 5,
              },
              {
                name: "Tasha W.",
                text: "I've been natural for 5 years and finding someone who actually knows 4C hair was always hard. Not anymore.",
                rating: 5,
              },
              {
                name: "Jordan C.",
                text: "Feed-in braids for my daughter's graduation. The stylist was patient, professional, and the braids lasted 8 weeks.",
                rating: 4,
              },
              {
                name: "Malik H.",
                text: "Faux locs for my vacation — found a stylist near Largo, booked two days out. Came out exactly like the reference.",
                rating: 5,
              },
              {
                name: "Brianna S.",
                text: "As a stylist, I love that reviews are only from real clients. My reputation is built on actual work, not spam.",
                rating: 5,
              },
              {
                name: "Omar D.",
                text: "Moved to DC last year. Found my barber through Krowned the first week. Been going back every two weeks since.",
                rating: 5,
              },
            ]}
          />
          </div>
        </div>
      </section>

      {/* From the Blog */}
      {blogPosts.length > 0 && (
        <section className="w-full border-b border-border bg-muted/30 px-5 py-16 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              From the Blog
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Tips, guides, and stories for the textured-hair community.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
                >
                  {post.cover_url && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <Image
                        src={post.cover_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                View all posts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA — for clients */}
      <section className="w-full px-5 py-16 text-center sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8 sm:p-12">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
            Ready to get crowned?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Join clients across DC, Maryland, and Virginia who book their
            braider, loc tech, or barber on Krowned. Free for clients — always.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse stylists <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Create free account
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Are you a stylist?{" "}
            <Link
              href="/for-stylists"
              className="font-medium text-primary hover:underline"
            >
              List your studio free &rarr;
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── HomePlanCard ─────────────────────────────────────────────────

function HomePlanCard({
  name,
  price,
  period,
  description,
  icon,
  badge,
  features,
  cta,
  ctaHref,
  variant,
}: {
  name: string;
  price: number;
  period: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaHref: string;
  variant: "default" | "primary";
}) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`relative flex flex-col rounded-xl p-6 ${
        isPrimary
          ? "border-2 border-primary bg-card shadow-lg"
          : "border border-border bg-card"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
          {badge}
        </span>
      )}

      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <p className="mt-4">
        <span className="text-3xl font-extrabold text-foreground">
          ${price}
        </span>
        <span className="text-sm text-muted-foreground"> {period}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-sm">
            {f.included ? (
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
            ) : (
              <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
            )}
            <span className={f.included ? "text-foreground" : "text-muted-foreground line-through"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`relative mt-6 block overflow-hidden rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          isPrimary
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border text-foreground hover:bg-muted"
        }`}
      >
        {isPrimary && (
          <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[glare_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        )}
        {cta}
      </Link>
    </div>
  );
}
