import Link from "next/link";
import { Calendar, Users, DollarSign, BarChart3, Link2, Star } from "lucide-react";

export default function ForProfessionalsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero px-4 py-20 text-center text-primary-foreground">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          Grow your business with Zawadi
        </h1>
        <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">
          Reach new clients, manage bookings, staff, and payments all in one platform. Start free, upgrade when you are ready.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup?type=professional"
            className="rounded-lg bg-background px-8 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
          >
            Start 14-day free trial
          </Link>
          <Link
            href="#pricing"
            className="rounded-lg border border-primary-foreground/30 px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-white/10"
          >
            View pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Everything you need to run your business
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Calendar, title: "Smart Booking", desc: "Clients book online 24/7. Auto-assign available staff. Reduce no-shows." },
            { icon: Users, title: "Staff Management", desc: "Invite your team, set their schedules, assign services, track performance." },
            { icon: DollarSign, title: "Payments & Tips", desc: "Accept online payments with tips. Track earnings. Get paid to your bank." },
            { icon: BarChart3, title: "Analytics", desc: "See bookings, revenue, and client trends. Make data-driven decisions." },
            { icon: Link2, title: "Your Booking Link", desc: "Share a direct booking link with your existing clients. They stay yours." },
            { icon: Star, title: "Reviews & Reputation", desc: "Collect verified reviews. Build trust. Stand out in search results." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Simple, transparent pricing
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-lg font-bold text-foreground">Free</h3>
              <p className="mt-1 text-3xl font-extrabold text-foreground">$0</p>
              <p className="text-sm text-muted-foreground">Forever</p>
              <ul className="mt-6 space-y-3 text-sm text-foreground">
                <li>Directory listing</li>
                <li>Basic business profile</li>
                <li>Discoverable in search</li>
                <li className="text-muted-foreground line-through">Booking engine</li>
                <li className="text-muted-foreground line-through">Online payments</li>
                <li className="text-muted-foreground line-through">Staff management</li>
              </ul>
              <Link
                href="/signup?type=professional"
                className="mt-8 block rounded-lg border border-border px-4 py-2 text-center text-sm font-semibold text-foreground hover:bg-muted"
              >
                Get started
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-xl border-2 border-primary bg-card p-8">
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
              <h3 className="text-lg font-bold text-foreground">Zawadi Pro</h3>
              <p className="mt-1 text-3xl font-extrabold text-foreground">
                $29.99
                <span className="text-sm font-normal text-muted-foreground"> /seat/mo</span>
              </p>
              <p className="text-sm text-muted-foreground">14-day free trial</p>
              <ul className="mt-6 space-y-3 text-sm text-foreground">
                <li>Everything in Free</li>
                <li>Full booking engine</li>
                <li>Online payments + tips</li>
                <li>Unlimited staff seats</li>
                <li>In-app messaging</li>
                <li>Analytics &amp; earnings</li>
                <li>Shareable booking link</li>
              </ul>
              <Link
                href="/signup?type=professional"
                className="mt-8 block rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-hero px-4 py-16 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold">Join thousands of professionals</h2>
        <p className="mt-2 opacity-90">No credit card required to start.</p>
        <Link
          href="/signup?type=professional"
          className="mt-6 inline-block rounded-lg bg-background px-8 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
        >
          Get started free
        </Link>
      </section>
    </div>
  );
}
