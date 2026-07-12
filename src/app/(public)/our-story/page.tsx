import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story — Krowned",
  description:
    "The world was never built for this hair. Krowned is the front door for braiders, loc techs, and textured-hair stylists in the DMV.",
};

export default function OurStoryPage() {
  return (
    <div>
      {/* Hero — full bleed */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden sm:min-h-[70vh]">
        <img
          src="/brand/bg-hero.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 px-6 pb-12 sm:px-12 sm:pb-16 lg:px-20">
          <h1 className="max-w-lg font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            You were always royalty.
          </h1>
        </div>
      </section>

      {/* Manifesto blocks */}
      <section className="mx-auto max-w-2xl px-6 py-20 sm:px-8">
        <div className="space-y-16">
          <p className="text-xl leading-relaxed text-foreground sm:text-2xl">
            The world was never built for this hair. Not the salons. Not the schedules. Not the software.
          </p>

          <p className="text-lg leading-relaxed text-muted-foreground">
            Textured hair has always been the exception — the checkbox at the bottom, the &ldquo;we don&apos;t really do that here.&rdquo; A law had to be passed so we could wear our own heads.
          </p>

          <p className="text-lg leading-relaxed text-muted-foreground">
            Meanwhile, the most important appointment you make gets the least respect. Eight hours in a chair. Hundreds of dollars. A style you&apos;ll wear for six weeks. Booked with a DM at 11pm and a CashApp deposit — hoping she&apos;s real.
          </p>

          <p className="text-lg leading-relaxed text-muted-foreground">
            You can book a flight in three taps. But your crown? Vibes.
          </p>

          <p className="text-lg leading-relaxed text-muted-foreground">
            And the stylist — a master of a craft older than any of us — is her own receptionist, her own deposit-chaser, absorbing every no-show. Not because she couldn&apos;t build something better. Because nobody built her a front door.
          </p>

          {/* The turn */}
          <div className="border-l-2 border-primary pl-6">
            <p className="text-xl font-semibold text-foreground sm:text-2xl">
              Krowned is the front door.
            </p>
          </div>

          <p className="text-lg leading-relaxed text-muted-foreground">
            Built for this hair, not adapted for it. Knotless is a category, not a note in the comments. Eight hours is a normal appointment, not a scheduling error. A deposit protects the artist&apos;s day.
          </p>

          <p className="text-lg leading-relaxed text-muted-foreground">
            Built in the DMV, for the DMV. Silver Spring. Bowie. Hyattsville. Southeast. Not an app parachuting in.
          </p>

          {/* Close */}
          <div className="space-y-4 pt-8">
            <p className="text-xl font-semibold text-foreground sm:text-2xl">
              Your hair was never the problem. The system was.
            </p>
            <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Your crown, booked.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-border bg-muted px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/explore"
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Find a stylist
          </Link>
          <Link
            href="/for-stylists"
            className="rounded-lg border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            I&apos;m a stylist
          </Link>
        </div>
      </section>
    </div>
  );
}
