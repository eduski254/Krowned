import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { HeroSearch } from "@/components/public/hero-search";
import {
  Search,
  Calendar,
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
  Fingerprint,
} from "lucide-react";
import { TestimonialsCarousel } from "@/components/public/testimonials-carousel";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { resolveCardImage } from "@/lib/explore/utils";
import { FeaturedCarousel } from "@/components/public/featured-carousel";

const HERO_BG_IMAGE = "/brand/hero-salon.webp";

export const metadata = {
  title: "Krowned — Book Braids, Locs & Textured Hair in the DMV",
  description:
    "Find and book braiders, loc techs, and textured-hair stylists in DC, Maryland, and Northern Virginia. Knotless braids, retwists, silk press, sew-ins, fades — your crown, booked.",
};

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
        "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, primary_category_id, service_categories(name, slug)",
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

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative flex min-h-[85dvh] items-center justify-center overflow-hidden text-center sm:min-h-[100dvh]">
        <img
          src={HERO_BG_IMAGE}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 lg:py-14">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
            Your crown, booked.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/90 drop-shadow-sm sm:mt-6 sm:text-lg">
            Every stylist specializes in textured hair. Find yours, see real
            openings, and book in seconds — no DMs, no ghosting.
          </p>

          <div className="mt-8 sm:mt-10">
            <HeroSearch
              businesses={searchBusinesses}
              serviceNames={serviceNames}
            />
          </div>

          {/* Trust badges under search */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary" /> ID-verified
              stylists
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Secure card payments
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> Instant confirmation
            </span>
          </div>
        </div>
      </section>

      {/* Trust signals bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 py-8 sm:gap-16 sm:py-10">
          {[
            {
              label: "Every stylist ID-verified",
              icon: Fingerprint,
            },
            {
              label: "Textured-hair specialists only",
              icon: Sparkles,
            },
            {
              label: "Real reviews from real clients",
              icon: Star,
            },
            {
              label: "Serving DC \u00B7 MD \u00B7 VA",
              icon: MapPin,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Style */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
                  href={`/explore?category=${cat.slug}`}
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
        </section>
      )}

      {/* Why Krowned */}
      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Booking that finally gets your hair.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            We built the booking platform that textured hair actually deserves.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Fingerprint,
                title: "Verified, texture-specialist stylists",
                desc: "Every pro is ID-verified and vetted for textured-hair work — no guessing whether they can handle your 4C, your locs, or your tension.",
              },
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
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
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
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          How It Works
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Three steps. No DMs. No drama.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Search,
              step: "1",
              title: "Find your stylist",
              desc: "Browse braiders, loc techs, and natural-hair pros across the DMV. Filter by style, location, and availability.",
            },
            {
              icon: Calendar,
              step: "2",
              title: "Book your seat",
              desc: "Pick your service, choose a time, lock it in. No DMs. No back-and-forth. Confirmed instantly.",
            },
            {
              icon: CheckCircle,
              step: "3",
              title: "Get crowned",
              desc: "Show up, sit back, leave feeling like royalty. Pay online or in the chair — tip your stylist right from the app.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <item.icon className="h-7 w-7 text-primary" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
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
      </section>

      {/* CTA band — for stylists */}
      <section className="relative overflow-hidden px-4 py-16 text-center text-white">
        <img
          src="/brand/bg-hero.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">
            You braid, loc, or style textured hair?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Stop losing bookings in your DMs. Get a real calendar, take
            deposits, cut no-shows, and get paid — free to start.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/for-stylists"
              className="inline-block rounded-lg bg-background px-8 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
            >
              List your studio — it&apos;s free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 underline underline-offset-4 hover:text-white"
            >
              See how it works <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/60 sm:text-sm">
            <span>14-day free trial</span>
            <span>No credit card required</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
      </section>

      {/* From the Blog */}
      {blogPosts.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
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
