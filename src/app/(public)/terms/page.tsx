{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Krowned",
  description: "Terms of Service for the Krowned booking marketplace.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-xl border border-border bg-muted/50 p-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contents</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li><a href="#platform-role" className="hover:text-foreground transition-colors">1. Platform Role &amp; Relationship</a></li>
          <li><a href="#eligibility" className="hover:text-foreground transition-colors">2. Eligibility &amp; Accounts</a></li>
          <li><a href="#acceptable-use" className="hover:text-foreground transition-colors">3. Acceptable Use &amp; Prohibited Conduct</a></li>
          <li><a href="#bookings" className="hover:text-foreground transition-colors">4. Bookings</a></li>
          <li><a href="#payments" className="hover:text-foreground transition-colors">5. Payments, Fees &amp; Taxes</a></li>
          <li><a href="#cancellations" className="hover:text-foreground transition-colors">6. Deposits, Cancellations, No-Shows &amp; Refunds</a></li>
          <li><a href="#reviews" className="hover:text-foreground transition-colors">7. Reviews &amp; Ratings</a></li>
          <li><a href="#content-ip" className="hover:text-foreground transition-colors">8. Content &amp; Intellectual Property</a></li>
          <li><a href="#disclaimers" className="hover:text-foreground transition-colors">9. Disclaimers &amp; Limitation of Liability</a></li>
          <li><a href="#indemnification" className="hover:text-foreground transition-colors">10. Indemnification</a></li>
          <li><a href="#disputes" className="hover:text-foreground transition-colors">11. Disputes &amp; Governing Law</a></li>
          <li><a href="#termination" className="hover:text-foreground transition-colors">12. Termination &amp; Suspension</a></li>
          <li><a href="#changes" className="hover:text-foreground transition-colors">13. Changes to These Terms</a></li>
          <li><a href="#contact" className="hover:text-foreground transition-colors">14. Contact</a></li>
        </ol>
      </nav>

      <div className="mt-10 space-y-10 text-foreground">
        {/* 1 */}
        <section id="platform-role">
          <h2 className="text-xl font-semibold font-heading">1. Platform Role &amp; Relationship</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Krowned is an online marketplace operated by <strong>[PLACEHOLDER &mdash; Legal Entity Name]</strong> (&ldquo;Krowned,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) that connects clients seeking hair and beauty services with independent stylists and businesses (&ldquo;Service Providers&rdquo;) in the Washington DC, Maryland, and Virginia (&ldquo;DMV&rdquo;) metropolitan area.
            </p>
            <p>
              <strong>Krowned is a technology platform, not a service provider.</strong> We do not perform, supervise, or control any hair, beauty, or grooming services. Service Providers listed on Krowned are independent businesses &mdash; not employees, agents, contractors, or franchisees of Krowned. We do not guarantee the quality, safety, legality, or timeliness of any service listed on or booked through our platform.
            </p>
            <p>
              When you book a service through Krowned, you are entering into a direct agreement with the Service Provider. Krowned facilitates the connection, scheduling, and payment processing but is not a party to the service contract between you and the Service Provider.
            </p>
          </div>
        </section>

        {/* 2 */}
        <section id="eligibility">
          <h2 className="text-xl font-semibold font-heading">2. Eligibility &amp; Accounts</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Age requirement.</strong> You must be at least 18 years old to create an account on Krowned. Individuals aged 13&ndash;17 may use the platform only with verifiable parental or guardian consent. Children under 13 may not use Krowned.
            </p>
            <p>
              <strong>Services for minors.</strong> A parent or guardian must book on behalf of a minor and assumes full responsibility for the booking, including consent to the service, payment, and adherence to cancellation policies.
            </p>
            <p>
              <strong>Account accuracy.</strong> You must provide truthful, current, and complete information when registering. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.
            </p>
            <p>
              <strong>One identity.</strong> Each person may maintain one account. Duplicate accounts may be merged or terminated at our discretion.
            </p>
          </div>
        </section>

        {/* 3 */}
        <section id="acceptable-use">
          <h2 className="text-xl font-semibold font-heading">3. Acceptable Use &amp; Prohibited Conduct</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the platform for any unlawful purpose or in violation of any applicable law.</li>
              <li>Harass, threaten, discriminate against, or abuse any user based on race, ethnicity, gender, sexual orientation, religion, disability, or any other protected characteristic.</li>
              <li>Post false, misleading, defamatory, or fraudulent content, including fake reviews.</li>
              <li>Impersonate another person or entity, or misrepresent your affiliation.</li>
              <li>Attempt to circumvent platform fees by arranging off-platform payment for services discovered through Krowned.</li>
              <li>Scrape, harvest, or collect data from the platform without written authorization.</li>
              <li>Interfere with or disrupt the integrity or performance of the platform.</li>
              <li>Use automated means (bots, scrapers) to access the platform without our prior consent.</li>
            </ul>
            <p>
              <strong>Harassment &amp; discrimination.</strong> Krowned has zero tolerance for harassment or discrimination. See our <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link> for detailed expectations. Violations may result in immediate account suspension or termination.
            </p>
          </div>
        </section>

        {/* 4 */}
        <section id="bookings">
          <h2 className="text-xl font-semibold font-heading">4. Bookings</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>How a booking is formed.</strong> A booking is confirmed when: (a) the client selects a service, date, and time; (b) the system confirms availability; and (c) payment or deposit is completed (for prepay services) or the booking is otherwise confirmed (for pay-at-store services). A confirmed booking creates a binding appointment between the client and the Service Provider.
            </p>
            <p>
              <strong>Client obligations.</strong> Arrive on time, communicate relevant information (hair type, allergies, special requirements), and pay the agreed amount. For mobile/at-home services, provide a safe, clean, and accessible workspace.
            </p>
            <p>
              <strong>Service Provider obligations.</strong> Honor confirmed bookings, perform services as described in the listing, maintain a professional and sanitary environment, communicate proactively about delays or issues, and adhere to all applicable licensing and health regulations.
            </p>
            <p>
              <strong>Manual bookings.</strong> Service Providers may create bookings on behalf of their clients (walk-ins, phone bookings). These bookings are subject to the same terms.
            </p>
          </div>
        </section>

        {/* 5 */}
        <section id="payments">
          <h2 className="text-xl font-semibold font-heading">5. Payments, Fees &amp; Taxes</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Payment processing.</strong> All online payments are processed by Stripe, Inc. By making a payment, you agree to Stripe&rsquo;s <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>. Krowned does not store your credit or debit card information.
            </p>
            <p>
              <strong>Platform fee.</strong> Krowned charges Service Providers a platform fee on each online booking transaction. This fee is deducted from the service amount before payout. The current fee rate is disclosed to Service Providers in their dashboard and in the <Link href="/stylist-terms" className="text-primary hover:underline">Stylist Terms</Link>.
            </p>
            <p>
              <strong>Tips.</strong> Tips are optional and pass through 100% to the Service Provider. No platform fee is applied to tips.
            </p>
            <p>
              <strong>Taxes.</strong> Service Providers are independently responsible for reporting and remitting all applicable taxes on income earned through the platform. Clients are responsible for any applicable sales or service taxes as required by their jurisdiction. Krowned does not provide tax advice.
            </p>
            <p>
              <strong>Currency.</strong> All prices on Krowned are displayed in US Dollars (USD) unless otherwise stated.
            </p>
          </div>
        </section>

        {/* 6 */}
        <section id="cancellations">
          <h2 className="text-xl font-semibold font-heading">6. Deposits, Cancellations, No-Shows &amp; Refunds</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              For the full details on our cancellation and refund framework, see our dedicated <Link href="/cancellation-policy" className="text-primary hover:underline">Cancellation &amp; Refund Policy</Link>.
            </p>
            <p>
              <strong>Summary:</strong> Service Providers may set their own cancellation policies within the bounds established by Krowned. Where a Service Provider has not set a custom policy, the platform default applies. Deposits may be partially or fully non-refundable depending on how far in advance a cancellation is made.
            </p>
            <p>
              <strong>Disputes.</strong> If a dispute arises between a client and a Service Provider regarding a cancellation or refund, the parties should first attempt to resolve it directly. If resolution cannot be reached, either party may contact Krowned at <strong>[PLACEHOLDER &mdash; support email]</strong> to request mediation. Krowned will review the circumstances and may, at its sole discretion, issue a full or partial refund, uphold the Service Provider&rsquo;s policy, or take other action it deems fair.
            </p>
            <p>
              Krowned&rsquo;s dispute resolution decision is final with respect to platform credits and refunds processed through our system. This does not limit either party&rsquo;s legal rights.
            </p>
          </div>
        </section>

        {/* 7 */}
        <section id="reviews">
          <h2 className="text-xl font-semibold font-heading">7. Reviews &amp; Ratings</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Honest reviews.</strong> Reviews must reflect a genuine experience with a confirmed booking. You may not post a review for a service you did not receive, or incentivize, coerce, or purchase reviews.
            </p>
            <p>
              <strong>Prohibited review content.</strong> Reviews may not contain hate speech, personal attacks, threats, spam, advertising, or content unrelated to the service received.
            </p>
            <p>
              <strong>Moderation.</strong> Krowned reserves the right to remove or edit reviews that violate these guidelines, contain prohibited content, or are determined to be fraudulent. We do not edit reviews to favor Service Providers; moderation is applied neutrally.
            </p>
            <p>
              <strong>Owner responses.</strong> Service Providers may post one public response to each review. Responses must be professional and may not contain personal attacks or threats.
            </p>
          </div>
        </section>

        {/* 8 */}
        <section id="content-ip">
          <h2 className="text-xl font-semibold font-heading">8. Content &amp; Intellectual Property</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Your content.</strong> You retain ownership of content you upload (photos, portfolio images, reviews, descriptions). By uploading content to Krowned, you grant us a worldwide, non-exclusive, royalty-free, sublicensable license to use, display, reproduce, modify (e.g., resize, crop), and distribute that content in connection with operating, promoting, and improving the platform.
            </p>
            <p>
              <strong>Service Provider portfolios.</strong> Service Providers own their portfolio photos and may remove them at any time. Removal terminates the license with respect to removed content, except where content has already been incorporated into marketing materials &mdash; in which case Krowned will make reasonable efforts to remove it upon request.
            </p>
            <p>
              <strong>Krowned content.</strong> The Krowned name, logo, design system, and platform software are the property of [PLACEHOLDER &mdash; Legal Entity Name]. You may not copy, modify, or distribute our proprietary content without written permission.
            </p>
            <p>
              <strong>Copyright complaints (DMCA).</strong> If you believe content on Krowned infringes your copyright, submit a written notice to our designated agent:
            </p>
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-xs">
              <p><strong>DMCA Agent:</strong> [PLACEHOLDER &mdash; DMCA Agent Name]</p>
              <p><strong>Address:</strong> [PLACEHOLDER &mdash; Registered Address]</p>
              <p><strong>Email:</strong> [PLACEHOLDER &mdash; DMCA Email]</p>
            </div>
            <p>
              Your notice must include: (1) identification of the copyrighted work; (2) identification of the infringing material and its location on the platform; (3) your contact information; (4) a statement of good-faith belief that use is unauthorized; (5) a statement under penalty of perjury that the notice is accurate and you are the copyright owner or authorized agent; and (6) your physical or electronic signature.
            </p>
          </div>
        </section>

        {/* 9 */}
        <section id="disclaimers">
          <h2 className="text-xl font-semibold font-heading">9. Disclaimers &amp; Limitation of Liability</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p className="uppercase font-semibold text-foreground text-xs tracking-wide">
              THE FOLLOWING SECTION CONTAINS IMPORTANT LIMITATIONS. PLEASE READ CAREFULLY.
            </p>
            <p>
              <strong>As-is basis.</strong> Krowned is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, whether express, implied, or statutory, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p>
              <strong>No guarantee of service quality.</strong> We do not warrant the quality, safety, legality, or availability of any service listed on the platform. We do not endorse any Service Provider and make no representations about their qualifications, licensing status, or insurance coverage.
            </p>
            <p>
              <strong>Limitation of liability.</strong> To the maximum extent permitted by law, Krowned and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or related to your use of the platform or any service booked through it &mdash; regardless of the theory of liability.
            </p>
            <p>
              Our total aggregate liability for any claims arising under these Terms shall not exceed the greater of: (a) the amount you paid to Krowned (not to Service Providers) in the twelve (12) months preceding the claim, or (b) one hundred US dollars ($100).
            </p>
            <p>
              <strong>Assumption of risk.</strong> You acknowledge that hair and beauty services carry inherent risks, including allergic reactions, damage to hair or scalp, and dissatisfaction with results. For mobile/at-home appointments, additional risks may include property damage or personal safety concerns. You assume these risks when booking.
            </p>
          </div>
        </section>

        {/* 10 */}
        <section id="indemnification">
          <h2 className="text-xl font-semibold font-heading">10. Indemnification</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              You agree to indemnify, defend, and hold harmless Krowned and its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to: (a) your use of the platform; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any service you provide or receive through the platform.
            </p>
          </div>
        </section>

        {/* 11 */}
        <section id="disputes">
          <h2 className="text-xl font-semibold font-heading">11. Disputes &amp; Governing Law</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Governing law.</strong> These Terms are governed by the laws of the [PLACEHOLDER &mdash; Governing State, e.g., &ldquo;Commonwealth of Virginia&rdquo; or &ldquo;District of Columbia&rdquo;], without regard to conflict-of-law principles.
            </p>
            <p>
              <strong>Venue.</strong> Any legal action arising under these Terms shall be brought exclusively in the state or federal courts located in [PLACEHOLDER &mdash; Venue/Jurisdiction].
            </p>
            {/* FLAG FOR ATTORNEY: The following arbitration clause needs careful review.
                Arbitration clauses have specific enforceability rules under the Federal Arbitration Act
                and state laws. Class-action waivers may not be enforceable in all contexts (e.g., NLRA claims,
                certain consumer protection statutes). Attorney should confirm this language is appropriate
                for a consumer-facing marketplace in the DMV. */}
            <p>
              <strong>Binding arbitration.</strong> Except for disputes involving intellectual property rights or claims eligible for small claims court, you and Krowned agree to resolve any dispute arising under these Terms through binding individual arbitration administered by [PLACEHOLDER &mdash; Arbitration Provider, e.g., &ldquo;JAMS&rdquo; or &ldquo;AAA&rdquo;] under its Consumer Arbitration Rules. The arbitration shall take place in [PLACEHOLDER &mdash; Arbitration Location].
            </p>
            <p>
              <strong>Class-action waiver.</strong> You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. If this waiver is found unenforceable, the entirety of this arbitration provision shall be void.
            </p>
            <p>
              <strong>Opt-out.</strong> You may opt out of this arbitration agreement by sending written notice to [PLACEHOLDER &mdash; Legal Email] within 30 days of first accepting these Terms. Your notice must include your name, account email, and a clear statement that you wish to opt out.
            </p>
          </div>
        </section>

        {/* 12 */}
        <section id="termination">
          <h2 className="text-xl font-semibold font-heading">12. Termination &amp; Suspension</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>By you.</strong> You may close your account at any time by contacting us. Outstanding payment obligations survive termination.
            </p>
            <p>
              <strong>By Krowned.</strong> We may suspend or terminate your account immediately, with or without notice, if we reasonably believe you have violated these Terms, engaged in fraudulent or illegal activity, or pose a risk to other users or to the platform. We may also terminate accounts that are inactive for an extended period.
            </p>
            <p>
              <strong>Effect of termination.</strong> Upon termination: your access to the platform ceases; confirmed future bookings may be cancelled; any amounts owed to Krowned become immediately due; licenses granted by you survive solely to the extent content has already been publicly displayed.
            </p>
          </div>
        </section>

        {/* 13 */}
        <section id="changes">
          <h2 className="text-xl font-semibold font-heading">13. Changes to These Terms</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We may update these Terms from time to time. If we make material changes, we will notify you by email or by posting a prominent notice on the platform at least 30 days before the changes take effect. Your continued use of Krowned after changes take effect constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the platform and close your account.
            </p>
            <p>
              <strong>Severability.</strong> If any provision of these Terms is held to be invalid or unenforceable, that provision will be enforced to the maximum extent permissible and the remaining provisions will remain in full force.
            </p>
            <p>
              <strong>Entire agreement.</strong> These Terms, together with the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, <Link href="/cancellation-policy" className="text-primary hover:underline">Cancellation Policy</Link>, <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>, and (for Service Providers) the <Link href="/stylist-terms" className="text-primary hover:underline">Stylist Terms</Link>, constitute the entire agreement between you and Krowned.
            </p>
          </div>
        </section>

        {/* 14 */}
        <section id="contact">
          <h2 className="text-xl font-semibold font-heading">14. Contact</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>For questions about these Terms:</p>
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-xs">
              <p><strong>[PLACEHOLDER &mdash; Legal Entity Name]</strong></p>
              <p>[PLACEHOLDER &mdash; Registered Address]</p>
              <p>Email: [PLACEHOLDER &mdash; Legal/Support Email]</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
