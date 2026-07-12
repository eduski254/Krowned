{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Community Guidelines — Krowned",
  description: "How we expect everyone on Krowned to treat each other.",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Community Guidelines</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      <div className="mt-6 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <p>
          Krowned exists because of community &mdash; stylists who pour hours into their craft and clients who trust them with their crown. These guidelines keep that trust intact.
        </p>
      </div>

      <div className="mt-10 space-y-10 text-foreground">
        <section>
          <h2 className="text-xl font-semibold font-heading">Respect Is Non-Negotiable</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Every interaction on Krowned &mdash; in-person, in reviews, or in messages &mdash; must be respectful.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Treat every person with dignity regardless of race, ethnicity, gender identity, sexual orientation, religion, age, disability, or any other characteristic.</li>
              <li>Communicate clearly and kindly. Disagreements happen; cruelty doesn&rsquo;t have to.</li>
              <li>Respect people&rsquo;s time. Show up when you said you would, cancel with notice when you can&rsquo;t.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">No Discrimination</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Krowned is a platform built for the textured-hair community. We celebrate diversity in all its forms. Discrimination is not tolerated:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Service Providers may not refuse service based on a client&rsquo;s race, ethnicity, gender, sexual orientation, religion, disability, or any protected characteristic.</li>
              <li>Clients may not harass or demean a Service Provider for any reason.</li>
              <li>Discriminatory language in reviews, messages, or listings will be removed and may result in account suspension.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">No Harassment or Threats</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Zero tolerance for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Threats of violence or harm.</li>
              <li>Sexual harassment, unwanted advances, or inappropriate comments about appearance.</li>
              <li>Stalking, doxxing, or sharing another person&rsquo;s private information.</li>
              <li>Intimidation, bullying, or persistent unwanted contact.</li>
              <li>Retaliatory behavior (e.g., threatening a bad review to get free services, or blacklisting a client for leaving an honest review).</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Review Integrity</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Reviews are the backbone of trust on Krowned. Keep them honest.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Be honest.</strong> Share your genuine experience. Mention what went well and what didn&rsquo;t.</li>
              <li><strong>Be specific.</strong> &ldquo;The braids were uneven and fell out after 2 weeks&rdquo; is useful. &ldquo;Terrible, never go here&rdquo; is not.</li>
              <li><strong>No fake reviews.</strong> Do not review a service you did not receive. Do not create accounts to boost or tank ratings.</li>
              <li><strong>No incentivized reviews.</strong> Service Providers may not offer discounts, free services, or other incentives in exchange for positive reviews.</li>
              <li><strong>No retaliation.</strong> Service Providers may not refuse future service, harass, or threaten a client for leaving an honest negative review.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Safety for Mobile &amp; At-Home Appointments</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Mobile/at-home services bring someone into your space or you into theirs. Extra care is needed:</p>

            <p className="mt-3"><strong>For clients hosting at home:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide a clean, well-lit workspace with access to water and electricity (as specified by the stylist).</li>
              <li>Ensure the stylist can work without interference or safety concerns.</li>
              <li>Children and pets should be supervised and kept away from the work area.</li>
              <li>Share only necessary personal information (address for navigation, contact number).</li>
            </ul>

            <p className="mt-3"><strong>For stylists traveling to clients:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Share your schedule/location with a trusted contact when traveling to unfamiliar addresses.</li>
              <li>Trust your instincts. If a situation feels unsafe, you may leave &mdash; contact Krowned support if needed.</li>
              <li>Arrive prepared with your own equipment; do not rely on the client to provide tools.</li>
              <li>Respect the client&rsquo;s home. Leave the workspace as clean as you found it.</li>
            </ul>

            <p className="mt-3"><strong>For everyone:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Do not share a client&rsquo;s or stylist&rsquo;s home address with anyone else.</li>
              <li>Report any safety concerns immediately to Krowned at <strong>[PLACEHOLDER &mdash; Support Email]</strong>.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Accurate Representation</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Service Providers: list accurate prices, durations, and descriptions. Portfolio photos must be your own work.</li>
              <li>Clients: provide accurate information about your hair (length, texture, condition) and any relevant history (chemical treatments, allergies).</li>
              <li>Do not impersonate another person or business.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Reporting Violations</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>If you experience or witness a violation of these guidelines:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Email <strong>[PLACEHOLDER &mdash; Support Email]</strong> with details of what happened, who was involved, and any evidence (screenshots, booking references).</li>
              <li>For immediate safety concerns, contact local law enforcement first, then notify Krowned.</li>
              <li>Reports are reviewed within 48 hours. You will receive an acknowledgment and an outcome summary.</li>
              <li>Reports are handled confidentially. We do not disclose the reporter&rsquo;s identity to the reported party without consent (unless required by law).</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Enforcement</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Violations may result in:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Warning:</strong> first-time or minor violations.</li>
              <li><strong>Content removal:</strong> removal of reviews, listings, or messages that violate guidelines.</li>
              <li><strong>Temporary suspension:</strong> restricted access while an investigation is conducted.</li>
              <li><strong>Permanent removal:</strong> serious or repeated violations result in account termination.</li>
            </ul>
            <p>The severity of enforcement depends on the nature of the violation, whether it&rsquo;s a pattern, and the impact on other users. We aim to be fair and proportionate.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
