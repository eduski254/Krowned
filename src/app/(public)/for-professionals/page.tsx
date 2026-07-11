import Link from "next/link";
import { Calendar, Users, DollarSign, BarChart3, Link2, Star, Check, X, Zap, Crown, Building2 } from "lucide-react";

export default function ForProfessionalsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero px-4 py-20 text-center text-primary-foreground">
        <h1 className="text-3xl font-bold font-heading sm:text-4xl lg:text-5xl">
          Grow your business with Krown
        </h1>
        <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">
          Reach new clients, manage bookings, staff, and payments all in one platform. Start free, upgrade when you&apos;re ready.
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
        <h2 className="text-center text-2xl font-bold text-foreground font-heading">
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
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-foreground font-heading">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            All paid plans include a 14-day free trial. No credit card required.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free */}
            <PlanCard
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

            {/* Starter */}
            <PlanCard
              name="Starter"
              price={15}
              period="/seat/mo"
              description="For solo professionals"
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

            {/* Pro — highlighted */}
            <PlanCard
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

            {/* Enterprise */}
            <PlanCard
              name="Enterprise"
              price={49}
              period="/seat/mo"
              description="For large businesses"
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
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground font-heading">
          Compare plans
        </h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-left font-medium text-muted-foreground">Feature</th>
                <th className="py-3 text-center font-medium text-muted-foreground">Free</th>
                <th className="py-3 text-center font-medium text-muted-foreground">Starter</th>
                <th className="py-3 text-center font-medium text-foreground">Pro</th>
                <th className="py-3 text-center font-medium text-muted-foreground">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <CompareRow feature="Directory listing" free pro starter enterprise />
              <CompareRow feature="Booking engine" starter pro enterprise />
              <CompareRow feature="Online payments" starter pro enterprise />
              <CompareRow feature="Shareable booking link" starter pro enterprise />
              <CompareRow feature="Staff seats" freeText="—" starterText="1" proText="Up to 10" enterpriseText="Unlimited" />
              <CompareRow feature="Bookable services" freeText="—" starterText="5" proText="Unlimited" enterpriseText="Unlimited" />
              <CompareRow feature="In-app messaging" pro enterprise />
              <CompareRow feature="Featured placement" enterprise />
              <CompareRow feature="14-day free trial" starter pro enterprise />
            </tbody>
          </table>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-hero px-4 py-16 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold font-heading">Join thousands of professionals</h2>
        <p className="mt-2 opacity-90">No credit card required to start your trial.</p>
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

// ── Components ─────────────────────────────────────────────────────

function PlanCard({
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
        className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          isPrimary
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border text-foreground hover:bg-muted"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function CompareRow({
  feature,
  free,
  starter,
  pro,
  enterprise,
  freeText,
  starterText,
  proText,
  enterpriseText,
}: {
  feature: string;
  free?: boolean;
  starter?: boolean;
  pro?: boolean;
  enterprise?: boolean;
  freeText?: string;
  starterText?: string;
  proText?: string;
  enterpriseText?: string;
}) {
  const cell = (included?: boolean, text?: string) => {
    if (text) return <span className="text-foreground">{text}</span>;
    if (included) return <Check className="mx-auto h-4 w-4 text-success" />;
    return <X className="mx-auto h-4 w-4 text-muted-foreground/30" />;
  };

  return (
    <tr>
      <td className="py-3 text-foreground">{feature}</td>
      <td className="py-3 text-center">{cell(free, freeText)}</td>
      <td className="py-3 text-center">{cell(starter, starterText)}</td>
      <td className="py-3 text-center">{cell(pro, proText)}</td>
      <td className="py-3 text-center">{cell(enterprise, enterpriseText)}</td>
    </tr>
  );
}
