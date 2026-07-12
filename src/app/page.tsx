import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { HeroSearch } from "@/components/public/hero-search";
import { Search, Calendar, CheckCircle, ArrowRight } from "lucide-react";
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
            Find braiders, loc techs, and textured-hair stylists in the DMV.
          </p>

          <div className="mt-8 sm:mt-10">
            <HeroSearch
              businesses={searchBusinesses}
              serviceNames={serviceNames}
            />
          </div>
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

      {/* Featured Stylists */}
      {featuredBusinesses.length > 0 && (
        <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
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
                  const cat = biz.service_categories as unknown as { name: string; slug: string } | null;
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

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          How It Works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { icon: Search, title: "Find your stylist", desc: "Browse braiders, loc techs, and natural-hair pros across the DMV. Filter by style, location, and availability." },
            { icon: Calendar, title: "Book your seat", desc: "Pick your service, choose a time, lock it in. No DMs. No back-and-forth." },
            { icon: CheckCircle, title: "Get crowned", desc: "Show up, sit back, leave feeling like royalty. Pay online or in the chair." },
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
      <section className="relative overflow-hidden px-4 py-16 text-center text-white">
        <img src="/brand/bg-hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">
            You braid, loc, or style textured hair?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Stop losing bookings to DMs. Get a real system for your craft.
          </p>
          <Link
            href="/for-stylists"
            className="mt-8 inline-block rounded-lg bg-background px-8 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
          >
            List your studio
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          What People Are Saying
        </h2>
        <div className="mt-10">
          <TestimonialsCarousel
            testimonials={[
              { name: "Jasmine T.", text: "Finally found a braider through Krowned in like two minutes. Knotless came out perfect. No more scrolling IG for hours.", rating: 5 },
              { name: "Marcus W.", text: "I run a barbershop in Bowie. Krowned fills my empty slots without me posting on IG every day. Real talk.", rating: 5 },
              { name: "Aisha R.", text: "No more screenshots and CashApp deposits. My clients book and pay online. I can actually plan my week.", rating: 5 },
              { name: "Tiana M.", text: "My loc retwist used to take three weeks of back-and-forth DMs to schedule. Booked it in 30 seconds on Krowned.", rating: 5 },
              { name: "DeAndre J.", text: "Got a fresh taper and lineup for my interview. Found the barber, booked same-day. Clean.", rating: 5 },
              { name: "Nia K.", text: "I drive from Arlington to Silver Spring for my braider. Having her schedule online saves me so much time.", rating: 5 },
              { name: "Crystal P.", text: "Silk press came out gorgeous. Left a review right after so other naturals can find her too.", rating: 5 },
              { name: "Dominique R.", text: "The deposit system is clutch. No more people ghosting on my 6-hour braiding appointments.", rating: 5 },
              { name: "Kev B.", text: "My barbershop in Hyattsville is fully booked most weeks now. Krowned brought in clients I never would have reached.", rating: 5 },
              { name: "Simone L.", text: "Booked a sew-in with closure for my birthday. Stylist was verified, portfolio was fire, everything was smooth.", rating: 5 },
              { name: "Tasha W.", text: "I've been natural for 5 years and finding someone who actually knows 4C hair was always hard. Not anymore.", rating: 5 },
              { name: "Jordan C.", text: "Feed-in braids for my daughter's graduation. The stylist was patient, professional, and the braids lasted 8 weeks.", rating: 4 },
              { name: "Malik H.", text: "Faux locs for my vacation — found a stylist near Largo, booked two days out. Came out exactly like the reference.", rating: 5 },
              { name: "Brianna S.", text: "As a stylist, I love that reviews are only from real clients. My reputation is built on actual work, not spam.", rating: 5 },
              { name: "Omar D.", text: "Moved to DC last year. Found my barber through Krowned the first week. Been going back every two weeks since.", rating: 5 },
            ]}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
