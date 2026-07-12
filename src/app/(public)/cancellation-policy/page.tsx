{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Cancellation & Refund Policy — Krowned",
  description: "How cancellations, deposits, no-shows, and refunds work on Krowned.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Cancellation &amp; Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      <div className="mt-6 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Plain-English summary:</strong> We know your time is valuable &mdash; yours and your stylist&rsquo;s. This policy exists so everyone knows what to expect when plans change. Stylists can set their own rules within the framework below.
        </p>
      </div>

      <div className="mt-10 space-y-10 text-foreground">
        <section>
          <h2 className="text-xl font-semibold font-heading">How Deposits Work</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Many stylists on Krowned require a deposit or full prepayment to secure your appointment. This is especially common for long services (braids, locs, sew-ins) where the stylist blocks several hours exclusively for you.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Deposit amounts are set by each Service Provider and are clearly displayed before you confirm your booking.</li>
              <li>Deposits are charged at the time of booking via Stripe.</li>
              <li>The deposit is applied toward your total service cost &mdash; it is not an additional fee.</li>
              <li>For services marked &ldquo;pay at store,&rdquo; no deposit is required and payment is made directly to the stylist at the appointment.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Default Cancellation Windows</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>The following default policy applies unless the Service Provider has set a custom policy (displayed on their booking page):</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold text-foreground">When You Cancel</th>
                    <th className="p-3 text-left font-semibold text-foreground">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3">48+ hours before appointment</td>
                    <td className="p-3">Full refund of deposit/prepayment</td>
                  </tr>
                  <tr>
                    <td className="p-3">24&ndash;48 hours before appointment</td>
                    <td className="p-3">50% of deposit refunded</td>
                  </tr>
                  <tr>
                    <td className="p-3">Less than 24 hours before appointment</td>
                    <td className="p-3">No refund (deposit forfeited)</td>
                  </tr>
                  <tr>
                    <td className="p-3">No-show (no cancellation, no arrival)</td>
                    <td className="p-3">No refund (full prepayment forfeited)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Custom Stylist Policies</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Service Providers may set their own cancellation policies that are stricter or more lenient than the default, within the following platform bounds:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The minimum free-cancellation window a stylist may offer is 24 hours before the appointment.</li>
              <li>Deposits may not exceed 50% of the total service cost for the default cancellation tier.</li>
              <li>Custom policies must be clearly displayed on the booking page before confirmation.</li>
            </ul>
            <p>
              By confirming a booking, you agree to the specific cancellation policy displayed at checkout &mdash; whether that&rsquo;s the platform default or the stylist&rsquo;s custom policy.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">No-Shows</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Client no-show:</strong> If you do not arrive and do not cancel, the full deposit or prepayment is forfeited. Repeated no-shows (3 or more) may result in account restrictions.
            </p>
            <p>
              <strong>Stylist no-show:</strong> If a Service Provider fails to honor a confirmed booking without adequate notice, you are entitled to a full refund. Please contact us at <strong>[PLACEHOLDER &mdash; Support Email]</strong> and we will process the refund within 5&ndash;10 business days.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Late Arrivals</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Client late arrivals:</strong> Service Providers may, at their discretion, reduce the service scope to fit the remaining time, reschedule, or cancel the appointment. If cancelled due to a late arrival exceeding 15 minutes, the no-show policy applies.
            </p>
            <p>
              <strong>Stylist running late:</strong> If your stylist is running behind, you will be notified (when possible). You are not penalized for a stylist&rsquo;s delay. If the delay is unacceptable, you may cancel without penalty.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Stylist-Initiated Cancellations</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Service Providers may cancel a confirmed booking in case of emergency, illness, or other unforeseen circumstances. When this happens:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You receive a full refund of any prepayment or deposit.</li>
              <li>The stylist is expected to notify you as early as possible.</li>
              <li>Repeated cancellations by a Service Provider may affect their platform standing and visibility.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">How Refunds Are Processed</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Refunds are processed back to the original payment method via Stripe.</li>
              <li>Processing time: 5&ndash;10 business days, depending on your bank or card issuer.</li>
              <li>Platform fees are refunded proportionally when a refund is issued.</li>
              <li>Tips, once paid out, are not refundable through Krowned (this is between you and the stylist).</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Disputes</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              If you and a Service Provider cannot agree on a cancellation or refund, contact Krowned at <strong>[PLACEHOLDER &mdash; Support Email]</strong>. We will review the booking details, communication history, and applicable policy, and make a determination within 5 business days.
            </p>
            <p>
              Our dispute resolution covers only payments processed through the Krowned platform. Payments made outside the platform (cash, direct transfers) are outside our scope.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Your Responsibilities</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p><strong>As a client:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cancel as early as possible if your plans change.</li>
              <li>Arrive on time. Respect the stylist&rsquo;s schedule.</li>
              <li>Communicate if you&rsquo;re running late &mdash; even 5 minutes can make a difference for a fully booked stylist.</li>
            </ul>
            <p className="mt-3"><strong>As a stylist:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Honor confirmed bookings. Your clients planned their day around this appointment.</li>
              <li>If you must cancel, do so as early as possible and communicate directly.</li>
              <li>Set a fair cancellation policy that reflects the realities of your service (long services justify stronger protections).</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Contact</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Questions about a specific booking or refund? Email <strong>[PLACEHOLDER &mdash; Support Email]</strong> with your booking reference.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
