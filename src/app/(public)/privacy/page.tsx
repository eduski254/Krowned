{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Krowned",
  description: "How Krowned collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-xl border border-border bg-muted/50 p-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contents</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li><a href="#data-collected" className="hover:text-foreground transition-colors">1. Information We Collect</a></li>
          <li><a href="#how-used" className="hover:text-foreground transition-colors">2. How We Use Your Information</a></li>
          <li><a href="#legal-bases" className="hover:text-foreground transition-colors">3. Legal Bases for Processing</a></li>
          <li><a href="#sharing" className="hover:text-foreground transition-colors">4. Who We Share Data With</a></li>
          <li><a href="#cookies" className="hover:text-foreground transition-colors">5. Cookies &amp; Tracking</a></li>
          <li><a href="#your-rights" className="hover:text-foreground transition-colors">6. Your Rights</a></li>
          <li><a href="#state-rights" className="hover:text-foreground transition-colors">7. State-Specific Privacy Rights</a></li>
          <li><a href="#retention" className="hover:text-foreground transition-colors">8. Data Retention</a></li>
          <li><a href="#security" className="hover:text-foreground transition-colors">9. Security</a></li>
          <li><a href="#children" className="hover:text-foreground transition-colors">10. Children&rsquo;s Privacy</a></li>
          <li><a href="#contact-records" className="hover:text-foreground transition-colors">11. Non-Account Contact Records</a></li>
          <li><a href="#international" className="hover:text-foreground transition-colors">12. International Data Transfers</a></li>
          <li><a href="#changes" className="hover:text-foreground transition-colors">13. Changes to This Policy</a></li>
          <li><a href="#contact" className="hover:text-foreground transition-colors">14. Contact Us</a></li>
        </ol>
      </nav>

      <div className="mt-10 space-y-10 text-foreground">
        {/* 1 */}
        <section id="data-collected">
          <h2 className="text-xl font-semibold font-heading">1. Information We Collect</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p><strong>Information you provide directly:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account information:</strong> full name, email address, phone number, password, account type (client or professional).</li>
              <li><strong>Profile information:</strong> bio, profile photo, business name, business description, address, service listings.</li>
              <li><strong>Portfolio content:</strong> photos, images, and descriptions uploaded by Service Providers to showcase their work.</li>
              <li><strong>Booking information:</strong> services selected, dates, times, staff preferences, special requests, cancellations.</li>
              <li><strong>Payment information:</strong> billing details are collected and processed by Stripe. Krowned does not directly store credit card numbers, CVVs, or full bank account numbers.</li>
              <li><strong>Communications:</strong> messages sent through the platform, support requests, reviews, and responses.</li>
              <li><strong>Location:</strong> business address, service area (for mobile stylists), and client location when searching for nearby providers.</li>
            </ul>

            <p><strong>Information collected automatically:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Device &amp; usage data:</strong> IP address, browser type, operating system, device identifiers, pages visited, actions taken, timestamps, referring URLs.</li>
              <li><strong>Location data:</strong> approximate location derived from IP address; precise location only with your explicit consent (e.g., &ldquo;Find stylists near me&rdquo; feature).</li>
              <li><strong>Cookies &amp; similar technologies:</strong> see Section 5 and our <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.</li>
            </ul>
          </div>
        </section>

        {/* 2 */}
        <section id="how-used">
          <h2 className="text-xl font-semibold font-heading">2. How We Use Your Information</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Provide the service:</strong> create and manage accounts, process bookings, facilitate payments, enable communication between clients and Service Providers.</li>
              <li><strong>Transactional communications:</strong> booking confirmations, reminders, cancellation notices, payment receipts, payout notifications.</li>
              <li><strong>Improve the platform:</strong> analyze usage patterns, fix bugs, develop new features, optimize search and recommendations.</li>
              <li><strong>Safety &amp; trust:</strong> detect fraud, enforce our Terms, verify Service Provider identities, moderate reviews.</li>
              <li><strong>Marketing (with consent):</strong> promotional emails about new features, special offers, or relevant stylists. You can opt out at any time.</li>
              <li><strong>Legal compliance:</strong> respond to legal requests, enforce our rights, comply with applicable laws and regulations.</li>
            </ul>
          </div>
        </section>

        {/* 3 */}
        <section id="legal-bases">
          <h2 className="text-xl font-semibold font-heading">3. Legal Bases for Processing</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>We process personal data based on:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Contract performance:</strong> processing necessary to fulfill our agreement with you (e.g., processing bookings, payments).</li>
              <li><strong>Legitimate interests:</strong> improving our platform, preventing fraud, marketing our services (balanced against your rights).</li>
              <li><strong>Consent:</strong> where you have given explicit consent (e.g., marketing emails, precise location access).</li>
              <li><strong>Legal obligation:</strong> where processing is required by law (e.g., tax reporting, responding to valid legal process).</li>
            </ul>
          </div>
        </section>

        {/* 4 */}
        <section id="sharing">
          <h2 className="text-xl font-semibold font-heading">4. Who We Share Data With</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p><strong>We never sell your personal data.</strong></p>
            <p>We share information with the following categories of recipients:</p>

            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-foreground">Stripe, Inc.</p>
                <p>Payment processing, payouts, fraud detection. Stripe processes payment card data under its own privacy policy.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Supabase, Inc.</p>
                <p>Database hosting, user authentication, file storage. Data stored in US data centers.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Resend (Loops, Inc.)</p>
                <p>Transactional email delivery (booking confirmations, reminders, etc.).</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Google LLC (Maps/Places API)</p>
                <p>Location search, map display, geocoding. Subject to Google&rsquo;s privacy policy.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Vercel, Inc.</p>
                <p>Website hosting, edge network, serverless functions. Data processed in accordance with Vercel&rsquo;s DPA.</p>
              </div>
            </div>

            <p><strong>Other users:</strong> When you book a service, we share your name, contact information, and booking details with the Service Provider. When a Service Provider lists services, their business information is publicly visible.</p>
            <p><strong>Legal requirements:</strong> We may disclose information if required by law, subpoena, or court order, or if we believe disclosure is necessary to protect our rights, safety, or the safety of others.</p>
            <p><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of that transaction. We will notify you before your data becomes subject to a different privacy policy.</p>
          </div>
        </section>

        {/* 5 */}
        <section id="cookies">
          <h2 className="text-xl font-semibold font-heading">5. Cookies &amp; Tracking</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We use cookies and similar technologies for authentication, preferences, and analytics. For a detailed breakdown of what cookies we use and how to control them, see our <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
            <p><strong>Essential cookies:</strong> Required for the platform to function (authentication, session management, security). Cannot be disabled.</p>
            <p><strong>Analytics cookies:</strong> Help us understand usage patterns and improve the platform. Can be opted out of.</p>
            <p><strong>Preference cookies:</strong> Remember your settings (theme, language, location history).</p>
            <p>We do not currently use third-party advertising cookies or sell data to ad networks.</p>
          </div>
        </section>

        {/* 6 */}
        <section id="your-rights">
          <h2 className="text-xl font-semibold font-heading">6. Your Rights</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
              <li><strong>Data portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Opt-out of marketing:</strong> Unsubscribe from promotional emails at any time via the link in each email or through your account settings.</li>
              <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time (without affecting prior processing).</li>
              <li><strong>Object to processing:</strong> Object to processing based on legitimate interests.</li>
            </ul>
            <p><strong>How to exercise your rights:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Most actions (update profile, delete account, manage preferences) can be performed directly in your account settings.</li>
              <li>For formal requests: email <strong>[PLACEHOLDER &mdash; Privacy Email, e.g., privacy@krowned.app]</strong> with the subject line &ldquo;Privacy Rights Request.&rdquo;</li>
              <li>We will respond within 30 days (or sooner if required by applicable law).</li>
              <li>We may need to verify your identity before processing requests.</li>
            </ul>
          </div>
        </section>

        {/* 7 */}
        <section id="state-rights">
          <h2 className="text-xl font-semibold font-heading">7. State-Specific Privacy Rights</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {/* FLAG FOR ATTORNEY: Confirm applicability of CCPA/CPRA and VCDPA given the
                company's size, revenue, and data processing volume. Small businesses may
                be exempt from some requirements. Also confirm if DC's consumer protection
                laws impose additional obligations. */}
            <p><strong>California (CCPA/CPRA):</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>We do not sell or share personal information for cross-context behavioral advertising.</li>
              <li>California residents have the right to know what personal information is collected, request deletion, and opt out of sale/sharing.</li>
              <li>We do not discriminate against users who exercise their privacy rights.</li>
              <li>To submit a request: email [PLACEHOLDER &mdash; Privacy Email] or use your account settings.</li>
            </ul>

            <p><strong>Virginia (VCDPA):</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Virginia residents have rights to access, correct, delete, and obtain a portable copy of their data.</li>
              <li>You may opt out of processing for targeted advertising, sale of personal data, or profiling with legal or significant effects.</li>
              <li>To appeal a denied request, contact [PLACEHOLDER &mdash; Privacy Email] with &ldquo;VCDPA Appeal&rdquo; in the subject line.</li>
            </ul>

            <p><strong>Maryland &amp; DC:</strong> We comply with applicable consumer protection laws in all jurisdictions where we operate. If you believe your rights have been violated, contact us or file a complaint with your state attorney general.</p>
          </div>
        </section>

        {/* 8 */}
        <section id="retention">
          <h2 className="text-xl font-semibold font-heading">8. Data Retention</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>We retain personal data only as long as necessary to fulfill the purposes described in this policy:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Active accounts:</strong> Data is retained for the duration of your account plus a reasonable wind-down period.</li>
              <li><strong>After account deletion:</strong> Most personal data is deleted within 30 days. Some data may be retained longer to comply with legal obligations (e.g., tax records for 7 years), resolve disputes, or enforce our agreements.</li>
              <li><strong>Booking records:</strong> Retained for [PLACEHOLDER &mdash; retention period, e.g., &ldquo;3 years&rdquo;] after the booking date for dispute resolution and legal compliance.</li>
              <li><strong>Payment records:</strong> Retained as required by tax and financial regulations.</li>
              <li><strong>Anonymized/aggregated data:</strong> May be retained indefinitely for analytics and improvement purposes.</li>
            </ul>
          </div>
        </section>

        {/* 9 */}
        <section id="security">
          <h2 className="text-xl font-semibold font-heading">9. Security</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>We implement reasonable technical and organizational measures to protect your data, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Encryption in transit (TLS/HTTPS) and at rest.</li>
              <li>Row-level security policies on our database ensuring users can only access their own data.</li>
              <li>Secure authentication with hashed passwords (via Supabase Auth).</li>
              <li>Regular security updates and dependency audits.</li>
              <li>Access controls limiting employee access to personal data on a need-to-know basis.</li>
            </ul>
            <p>No system is 100% secure. If we discover a data breach that is likely to result in a risk to your rights and freedoms, we will notify affected users and relevant authorities within 72 hours (or as required by applicable law).</p>
          </div>
        </section>

        {/* 10 */}
        <section id="children">
          <h2 className="text-xl font-semibold font-heading">10. Children&rsquo;s Privacy</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Krowned is not directed at children under 13 and we do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13 without verifiable parental consent, we will delete it promptly.
            </p>
            <p>
              Parents or guardians who believe their child under 13 has provided information to Krowned should contact us at [PLACEHOLDER &mdash; Privacy Email].
            </p>
          </div>
        </section>

        {/* 11 */}
        <section id="contact-records">
          <h2 className="text-xl font-semibold font-heading">11. Non-Account Contact Records</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Service Providers may create contact records for clients who do not have a Krowned account (e.g., walk-in clients, phone bookings). These records contain the client&rsquo;s name and phone number or email address, and are used solely for booking management by that Service Provider.
            </p>
            <p>
              <strong>Data controller.</strong> For non-account contact records, the Service Provider who created the record is the data controller. Krowned acts as a data processor, storing the data on their behalf.
            </p>
            <p>
              <strong>Your rights.</strong> If a Service Provider has created a contact record for you and you wish to access, correct, or delete it, you may: (a) contact the Service Provider directly; or (b) email Krowned at [PLACEHOLDER &mdash; Privacy Email] and we will facilitate the request.
            </p>
            <p>
              Non-account contacts do not receive marketing communications from Krowned. They may receive booking-related transactional messages (confirmations, reminders) initiated by the Service Provider.
            </p>
          </div>
        </section>

        {/* 12 */}
        <section id="international">
          <h2 className="text-xl font-semibold font-heading">12. International Data Transfers</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Krowned primarily operates in the United States. Your data is stored on servers located in the United States. If you access the platform from outside the US, your data will be transferred to and processed in the US. By using Krowned, you consent to this transfer.
            </p>
          </div>
        </section>

        {/* 13 */}
        <section id="changes">
          <h2 className="text-xl font-semibold font-heading">13. Changes to This Policy</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on the platform at least 30 days in advance. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision.
            </p>
          </div>
        </section>

        {/* 14 */}
        <section id="contact">
          <h2 className="text-xl font-semibold font-heading">14. Contact Us</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>For privacy questions or to exercise your rights:</p>
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-xs">
              <p><strong>[PLACEHOLDER &mdash; Legal Entity Name]</strong></p>
              <p>[PLACEHOLDER &mdash; Registered Address]</p>
              <p>Privacy inquiries: [PLACEHOLDER &mdash; Privacy Email, e.g., privacy@krowned.app]</p>
              <p>General support: [PLACEHOLDER &mdash; Support Email, e.g., hello@krowned.app]</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
