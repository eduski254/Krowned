import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — What to Expect | Krowned",
  description:
    "Deposits, cancellations, how long styles take, what to bring, how payment works. Everything you need to know before your appointment.",
};

const FAQS = [
  {
    q: "How do deposits work?",
    a: "When you book a service that requires a deposit, you pay online at the time of booking. This secures your spot and protects the stylist's time. The deposit is applied to your total — you pay the remainder at your appointment or the full amount is charged upfront depending on the service.",
  },
  {
    q: "What if I need to cancel?",
    a: "Each stylist sets their own cancellation policy — you'll see it before you book. Most allow free cancellation 24-48 hours in advance. Late cancellations or no-shows may forfeit the deposit. This protects stylists who blocked 4-8 hours for your appointment.",
  },
  {
    q: "How long do appointments take?",
    a: "It depends on the style. Knotless braids: 4-8 hours. Retwist: 1-2 hours. Silk press: 1.5-2 hours. Sew-in: 2-4 hours. Fade: 30-45 minutes. Your stylist's service listing shows the estimated duration.",
  },
  {
    q: "What should I bring to my appointment?",
    a: "Come with clean, detangled hair unless your stylist says otherwise. Some braiders prefer freshly washed hair, some don't — check with your stylist. Bring your own reference photos if you have a specific look in mind. For long appointments, bring your charger, snacks, or something to watch.",
  },
  {
    q: "How does payment work?",
    a: "Depends on the service. Some stylists accept full payment online at booking. Others take a deposit to hold your spot and collect the rest in the chair. Payment methods include card (via Stripe) and pay-at-store (cash/tap at the venue). Tips can be added online.",
  },
  {
    q: "Are the stylists verified?",
    a: "Yes. Every stylist on Krowned is reviewed before their profile goes live. We check their work, confirm they're a real business in the DMV, and only then do they appear in search. Reviews come from verified clients only — people who actually sat in the chair.",
  },
  {
    q: "I'm a stylist. How much does it cost?",
    a: "There's a free plan that gets you listed in the directory. Paid plans start at $15/seat/month and include the full booking engine, online payments, and deposits. All paid plans come with a 14-day free trial — no credit card required.",
  },
  {
    q: "What area does Krowned cover?",
    a: "The DMV — Washington DC, Maryland (Silver Spring, Bowie, Hyattsville, Largo, Bethesda, and more), and Northern Virginia (Alexandria, Arlington, Ashburn, Fairfax). We're focused here first and growing with the community.",
  },
  {
    q: "Can I book for someone else?",
    a: "Yes. When booking, you can add a note for the stylist with details about who the appointment is for. This is great for booking for kids, family, or as a gift.",
  },
  {
    q: "What if my stylist doesn't show up?",
    a: "It's rare — our stylists are verified professionals. But if it happens, contact us and we'll help resolve it. If you were charged, you'll get a full refund.",
  },
];

export default function FAQPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center text-white">
        <img src="/brand/bg-hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold sm:text-4xl">What to Expect</h1>
          <p className="mt-4 text-lg text-white/90">
            Straight answers. No fine print.
          </p>
        </div>
      </section>

      {/* FAQ list */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="divide-y divide-border">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-8">
              <h2 className="text-lg font-semibold text-foreground">
                {faq.q}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-foreground">Still have questions?</h2>
        <p className="mt-2 text-muted-foreground">
          Reach out and we&apos;ll get back to you.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Contact us
          </Link>
          <Link
            href="/explore"
            className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Find a stylist
          </Link>
        </div>
      </section>
    </div>
  );
}
