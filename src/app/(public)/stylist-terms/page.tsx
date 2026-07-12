{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Stylist & Business Terms — Krowned",
  description: "Terms for Service Providers listing on the Krowned marketplace.",
};

export default function StylistTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Stylist &amp; Business Terms</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      <div className="mt-6 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <p>
          These additional terms apply to you if you list your business or services on Krowned (&ldquo;Service Provider,&rdquo; &ldquo;you&rdquo;). They supplement the general <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> &mdash; both apply to you.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-xl border border-border bg-muted/50 p-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contents</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li><a href="#independent-status" className="hover:text-foreground transition-colors">1. Independent Business Status</a></li>
          <li><a href="#subscriptions" className="hover:text-foreground transition-colors">2. Subscriptions &amp; Billing</a></li>
          <li><a href="#platform-fees" className="hover:text-foreground transition-colors">3. Platform Fees &amp; Payouts</a></li>
          <li><a href="#obligations" className="hover:text-foreground transition-colors">4. Your Obligations</a></li>
          <li><a href="#content-license" className="hover:text-foreground transition-colors">5. Content &amp; Portfolio License</a></li>
          <li><a href="#suspension" className="hover:text-foreground transition-colors">6. Suspension &amp; Removal</a></li>
          <li><a href="#liability" className="hover:text-foreground transition-colors">7. Liability &amp; Indemnification</a></li>
          <li><a href="#contact" className="hover:text-foreground transition-colors">8. Contact</a></li>
        </ol>
      </nav>

      <div className="mt-10 space-y-10 text-foreground">
        {/* 1 */}
        <section id="independent-status">
          <h2 className="text-xl font-semibold font-heading">1. Independent Business Status</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>You are an independent business, not an employee, agent, or franchisee of Krowned.</strong> Nothing in these terms creates an employment relationship, partnership, joint venture, or agency between you and Krowned.
            </p>
            <p>
              You retain full control over: how you perform services, your prices, your schedule, your tools and products, your workspace, and which bookings you accept. Krowned does not direct, supervise, or control your work.
            </p>
            <p>
              You are solely responsible for: your own taxes (income, self-employment, sales), insurance, business licenses, health and safety compliance, and all obligations to your own employees or contractors (if any).
            </p>
          </div>
        </section>

        {/* 2 */}
        <section id="subscriptions">
          <h2 className="text-xl font-semibold font-heading">2. Subscriptions &amp; Billing</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Krowned offers the following subscription tiers:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold text-foreground">Plan</th>
                    <th className="p-3 text-left font-semibold text-foreground">Price</th>
                    <th className="p-3 text-left font-semibold text-foreground">Booking Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-semibold">Free</td>
                    <td className="p-3">$0/mo</td>
                    <td className="p-3">No &mdash; directory listing only</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Starter</td>
                    <td className="p-3">$15/seat/mo</td>
                    <td className="p-3">Yes &mdash; 1 staff, 5 services</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Pro</td>
                    <td className="p-3">$25/seat/mo</td>
                    <td className="p-3">Yes &mdash; up to 10 staff, unlimited services, messaging</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Enterprise</td>
                    <td className="p-3">$49/seat/mo</td>
                    <td className="p-3">Yes &mdash; unlimited staff, featured eligibility</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p><strong>14-day free trial.</strong> All paid plans include a 14-day trial with full access. No credit card is required to start a trial. At the end of the trial, you will be prompted to subscribe. If you do not subscribe, your account reverts to the Free plan.</p>
            <p><strong>Auto-renewal.</strong> Subscriptions renew automatically each billing cycle (monthly). You will be charged on the same date each month via Stripe.</p>
            <p><strong>Cancellation.</strong> You may cancel your subscription at any time from your dashboard. Cancellation takes effect at the end of the current billing period &mdash; you retain paid features until then. After cancellation, your account reverts to Free (directory listing only; booking engine disabled; excess staff become inactive).</p>
            <p><strong>Existing bookings.</strong> If you downgrade or cancel, already-prepaid future bookings will still be honored. You are obligated to fulfill those appointments.</p>
            <p><strong>Price changes.</strong> We may change subscription prices with at least 30 days&rsquo; notice. Price changes take effect at the next renewal date; you may cancel before then if you do not agree.</p>
          </div>
        </section>

        {/* 3 */}
        <section id="platform-fees">
          <h2 className="text-xl font-semibold font-heading">3. Platform Fees &amp; Payouts</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Platform fee.</strong> Krowned charges a commission on each online booking transaction. The fee is applied to the service amount only &mdash; not to tips. Your current commission rate is displayed in your business dashboard settings.
            </p>
            <p>
              <strong>Payouts.</strong> Payouts are processed through Stripe Connect. By accepting online payments through Krowned, you agree to Stripe&rsquo;s <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Connected Account Agreement</a>. Payout timing depends on your Stripe account settings (typically 2&ndash;7 business days after the service is rendered).
            </p>
            <p>
              <strong>Tips.</strong> Tips pass through 100% to you. No platform fee is applied to tips.
            </p>
            <p>
              <strong>Pay-at-store bookings.</strong> For bookings where the client pays in person, no payment flows through Krowned and no platform fee applies.
            </p>
            <p>
              <strong>Taxes.</strong> Platform fees may be subject to applicable taxes. You are independently responsible for all taxes on income received through the platform.
            </p>
          </div>
        </section>

        {/* 4 */}
        <section id="obligations">
          <h2 className="text-xl font-semibold font-heading">4. Your Obligations</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {/* FLAG FOR ATTORNEY: Licensing requirements vary significantly by jurisdiction.
                DC, MD, and VA each have different rules on braiding, cosmetology, and barbering licenses.
                Some states exempt natural hair braiding from cosmetology licensing. Attorney should confirm
                what language is appropriate here to avoid overstating or understating requirements. */}
            <p><strong>Licensing &amp; compliance.</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must hold all licenses, permits, and certifications required by your jurisdiction to perform the services you offer. This may include cosmetology, barbering, or braiding licenses depending on your location (DC, Maryland, or Virginia each have different requirements).</li>
              <li>You represent and warrant that you are legally authorized to offer the services listed on your profile.</li>
              <li>Krowned does not verify your licensing status. It is your sole responsibility to maintain compliance.</li>
            </ul>

            <p><strong>Insurance.</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>We strongly recommend (and may in the future require) that you maintain professional liability insurance appropriate for your services.</li>
              <li>For mobile/at-home services, you should carry insurance that covers services performed at client locations.</li>
            </ul>

            <p><strong>Health &amp; sanitation.</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Maintain clean, sanitary tools and workspace in accordance with applicable health regulations.</li>
              <li>Disclose any allergens or chemicals used in your services.</li>
              <li>Do not perform services on a client if you have reason to believe it could cause harm (allergic reactions, scalp conditions, etc.).</li>
            </ul>

            <p><strong>Accurate listings.</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Service descriptions, pricing, and duration estimates must be accurate and up to date.</li>
              <li>Portfolio photos must depict your own work. Do not use stock photos or another stylist&rsquo;s work.</li>
              <li>Do not misrepresent your qualifications, experience, or specialties.</li>
            </ul>

            <p><strong>Honoring bookings.</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You are expected to honor all confirmed bookings. If you must cancel, provide as much notice as possible and communicate directly with the client.</li>
              <li>Excessive cancellations may result in reduced visibility, warnings, or suspension.</li>
            </ul>
          </div>
        </section>

        {/* 5 */}
        <section id="content-license">
          <h2 className="text-xl font-semibold font-heading">5. Content &amp; Portfolio License</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              You retain ownership of all portfolio photos, images, and descriptions you upload to Krowned.
            </p>
            <p>
              By uploading content, you grant Krowned a worldwide, non-exclusive, royalty-free, sublicensable license to use, display, reproduce, modify (e.g., resize, crop, watermark), and distribute that content in connection with operating, marketing, and promoting the Krowned platform. This includes use on our website, social media, email campaigns, and advertising materials.
            </p>
            <p>
              You may remove your content at any time. Upon removal, the license terminates &mdash; except for content already incorporated into published marketing materials. We will make reasonable efforts to remove or replace such content upon request.
            </p>
            <p>
              <strong>Client consent.</strong> You represent that you have obtained consent from any individuals depicted in your portfolio photos for use on the platform.
            </p>
          </div>
        </section>

        {/* 6 */}
        <section id="suspension">
          <h2 className="text-xl font-semibold font-heading">6. Suspension &amp; Removal</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Krowned may suspend or remove your listing for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Violation of these Stylist Terms, the general Terms of Service, or Community Guidelines.</li>
              <li>Consistently poor reviews or unresolved client complaints indicating a pattern.</li>
              <li>Fraudulent activity, including fake reviews, misrepresented services, or fee circumvention.</li>
              <li>Failure to honor confirmed bookings without reasonable cause (pattern of cancellations or no-shows).</li>
              <li>Harassment, discrimination, or unsafe behavior toward clients or other users.</li>
              <li>Operating without required licenses (when brought to our attention).</li>
              <li>Non-payment of subscription fees after a grace period.</li>
            </ul>
            <p>
              <strong>Process.</strong> Except in cases of serious or immediate violations (safety threats, fraud), we will provide written notice and a reasonable opportunity to respond before permanent removal. Suspension may be immediate pending investigation.
            </p>
            <p>
              <strong>Effect of removal.</strong> Outstanding client bookings will be cancelled and prepayments refunded. Pending payouts will be processed according to Stripe&rsquo;s terms. Subscription fees are non-refundable for the current billing period.
            </p>
          </div>
        </section>

        {/* 7 */}
        <section id="liability">
          <h2 className="text-xl font-semibold font-heading">7. Liability &amp; Indemnification</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Your responsibility.</strong> You are solely responsible for the services you provide, including their quality, safety, and legality. Krowned does not supervise, direct, or guarantee your work.
            </p>
            <p>
              <strong>Indemnification.</strong> You agree to indemnify, defend, and hold harmless Krowned and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys&rsquo; fees) arising from: (a) the services you provide; (b) your violation of these terms; (c) your violation of any applicable law or regulation; (d) any claim by a client or third party related to your services; or (e) your content on the platform.
            </p>
            <p>
              <strong>Limitation of liability.</strong> Krowned&rsquo;s total liability to you for any claims arising under these terms shall not exceed the total platform fees you paid to Krowned in the twelve (12) months preceding the claim.
            </p>
          </div>
        </section>

        {/* 8 */}
        <section id="contact">
          <h2 className="text-xl font-semibold font-heading">8. Contact</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>For questions about these Stylist Terms:</p>
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-xs">
              <p><strong>[PLACEHOLDER &mdash; Legal Entity Name]</strong></p>
              <p>[PLACEHOLDER &mdash; Registered Address]</p>
              <p>Email: [PLACEHOLDER &mdash; Support Email, e.g., hello@krowned.app]</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
