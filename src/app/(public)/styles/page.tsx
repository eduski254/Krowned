import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Styles — Braids, Locs, Silk Press, Weaves & More | Krowned",
  description:
    "Browse textured-hair styles: knotless braids, locs, silk press, sew-ins, fades, and color. Find inspiration and book a stylist in the DMV.",
};

const STYLE_DESCRIPTIONS: Record<string, string> = {
  "braids-protective":
    "Knotless, feed-ins, goddess locs, box braids, cornrows, Fulani braids — protective styles that last weeks and look right from day one.",
  locs:
    "Starter locs, retwists, interlocks, loc repairs, faux locs. Whether you're starting your journey or maintaining your crown.",
  "natural-silk-press":
    "Wash-and-go, twist-outs, rod sets, silk press, blowouts. Styles that let your natural texture breathe or stretch without damage.",
  "weaves-extensions":
    "Sew-ins, closures, frontals, tape-ins, clip-ins. Versatility on your terms — install and maintenance.",
  "barbering-cuts":
    "Fades, tapers, line-ups, beard trims, razor parts. Precision cuts for all textures.",
  color:
    "Highlights, full color, balayage on natural hair, loc color, bleach and tone. Bold or subtle — your call.",
};

export default async function StylesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, slug, icon")
    .order("sort_order");

  const cats = (categories ?? []).filter((c) => c.slug !== "new-category");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center text-white">
        <img src="/brand/bg-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold sm:text-4xl">Styles</h1>
          <p className="mt-4 text-lg text-white/90">
            Whatever your texture needs. Find it, book it.
          </p>
        </div>
      </section>

      {/* Category cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat) => {
            const Icon = cat.icon ? CATEGORY_ICONS[cat.icon] : null;
            const desc = STYLE_DESCRIPTIONS[cat.slug] ?? "";

            return (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                {Icon && (
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                )}
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Find stylists <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground">Not sure what you want?</h2>
        <p className="mt-2 text-muted-foreground">
          Browse all stylists and see what inspires you.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Browse all stylists
        </Link>
      </section>
    </div>
  );
}
