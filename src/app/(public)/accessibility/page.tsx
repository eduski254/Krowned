{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Accessibility — Krowned",
  description: "Our commitment to making Krowned accessible to everyone.",
};

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Accessibility</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      <div className="mt-10 space-y-10 text-foreground">
        <section>
          <h2 className="text-xl font-semibold font-heading">Our Commitment</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Krowned is committed to ensuring digital accessibility for people of all abilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
            <p>
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards. These guidelines explain how to make web content more accessible to people with a wide range of disabilities, including visual, auditory, physical, speech, cognitive, and neurological disabilities.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">What We Do</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Keyboard navigation:</strong> All interactive elements are accessible via keyboard with visible focus indicators.</li>
              <li><strong>Screen reader support:</strong> We use semantic HTML, ARIA labels, and proper heading hierarchy to support assistive technologies.</li>
              <li><strong>Color contrast:</strong> Text and interactive elements meet WCAG AA contrast ratios.</li>
              <li><strong>Responsive design:</strong> The platform works across devices and screen sizes, including with zoom up to 200%.</li>
              <li><strong>Motion sensitivity:</strong> We respect the <code className="text-xs bg-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> preference for users sensitive to animation.</li>
              <li><strong>Form labels:</strong> All form inputs have associated labels for screen reader users.</li>
              <li><strong>Alt text:</strong> Informative images include descriptive alt text; decorative images are marked as such.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Known Limitations</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              While we strive for full accessibility, some areas may not yet be fully optimized:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Third-party embedded content (Google Maps, Stripe payment forms) may have accessibility limitations outside our direct control.</li>
              <li>Some user-uploaded content (portfolio photos, business descriptions) may not include alt text or accessible descriptions.</li>
              <li>Older PDF documents, if any, may not be fully screen-reader accessible.</li>
            </ul>
            <p>We are actively working to address these limitations and improve accessibility throughout the platform.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Report an Issue</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We welcome your feedback on the accessibility of Krowned. If you encounter any barriers or have suggestions for improvement, please contact us:
            </p>
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-xs">
              <p><strong>Email:</strong> [PLACEHOLDER &mdash; Accessibility Email, e.g., accessibility@krowned.app]</p>
              <p><strong>Response time:</strong> We aim to respond to accessibility reports within 5 business days.</p>
            </div>
            <p>
              When reporting an issue, please include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The URL or page where you encountered the issue.</li>
              <li>A description of the problem and what you were trying to do.</li>
              <li>The assistive technology you were using (if applicable), such as screen reader name/version, browser, and operating system.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Enforcement &amp; Standards</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              This statement was prepared based on a self-assessment of the Krowned platform. We plan to engage third-party accessibility auditors to validate and improve our conformance.
            </p>
            <p>
              We review and update this accessibility statement annually or when significant platform changes are made.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
