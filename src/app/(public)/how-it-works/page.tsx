import Link from "next/link";
import { Search, Calendar, CheckCircle, Star, Shield, CreditCard } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero px-4 py-16 text-center text-primary-foreground">
        <h1 className="text-3xl font-bold sm:text-4xl">How Zawadi Works</h1>
        <p className="mt-4 text-lg opacity-90">
          Book beauty and wellness services in three simple steps.
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-12">
          {[
            {
              step: "1",
              icon: Search,
              title: "Discover professionals near you",
              desc: "Browse by category, location, or name. Filter by price, rating, and availability. Every professional is verified before they appear on Zawadi.",
            },
            {
              step: "2",
              icon: Calendar,
              title: "Book instantly",
              desc: "Pick your service, choose your preferred professional (or let us match you with the best available), select a date and time, and confirm. It takes seconds.",
            },
            {
              step: "3",
              icon: CheckCircle,
              title: "Show up and enjoy",
              desc: "Arrive at your appointment and enjoy the service. Pay online beforehand or at the store. After your visit, leave a review to help the community.",
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

      {/* Features */}
      <section className="bg-muted px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Why Zawadi?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Shield, title: "Verified pros", desc: "Every business is reviewed before listing." },
              { icon: Star, title: "Real reviews", desc: "Only clients who completed a booking can review." },
              { icon: CreditCard, title: "Secure payments", desc: "Pay online or at the store. Your choice, always." },
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
        <h2 className="text-2xl font-bold text-foreground">Ready to book?</h2>
        <p className="mt-2 text-muted-foreground">
          Find your next beauty or wellness appointment.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Explore services
        </Link>
      </section>
    </div>
  );
}
