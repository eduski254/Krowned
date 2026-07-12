import { Metadata } from "next";
import Link from "next/link";
import { Search, Calendar, CheckCircle, Star, Shield, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "How Krowned Works — Book Braids, Locs & Textured Hair",
  description:
    "Book braiders, loc techs, and textured-hair stylists in the DMV in three steps. Find your stylist, book your seat, get crowned.",
};

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center text-white">
        <img src="/brand/bg-hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold sm:text-4xl">How Krowned Works</h1>
          <p className="mt-4 text-lg text-white/90">
            Three steps. No DMs. No back-and-forth.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {[
            {
              step: "1",
              icon: Search,
              title: "Find your stylist",
              desc: "Browse braiders, loc techs, natural-hair pros, and barbers across the DMV. Filter by style, location, rating, and availability. Every pro is verified before they go live.",
            },
            {
              step: "2",
              icon: Calendar,
              title: "Book your seat",
              desc: "Pick your service — knotless, retwist, silk press, sew-in, fade, whatever you need. Choose a time that works. Lock it in. Done.",
            },
            {
              step: "3",
              icon: CheckCircle,
              title: "Get crowned",
              desc: "Show up, sit back, leave feeling like royalty. Pay online beforehand or in the chair. After, leave a review so the community knows who does fire work.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Krowned */}
      <section className="bg-muted px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Why Krowned
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Shield, title: "Verified stylists", desc: "Every business is reviewed before listing. No random accounts." },
              { icon: Star, title: "Real reviews", desc: "Only clients who actually sat in the chair can leave a review." },
              { icon: CreditCard, title: "Flexible payments", desc: "Pay online or at the chair. Your choice." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground">Ready to get booked?</h2>
        <p className="mt-2 text-muted-foreground">
          Find your next braider, loc tech, or stylist in the DMV.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Find a stylist
        </Link>
      </section>
    </div>
  );
}
