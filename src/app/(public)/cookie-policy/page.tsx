{/* DRAFT — requires review by a licensed attorney before launch. */}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — Krowned",
  description: "How Krowned uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 11, 2026</p>

      <div className="mt-10 space-y-10 text-foreground">
        <section>
          <h2 className="text-xl font-semibold font-heading">What Are Cookies</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the platform. We also use similar technologies such as local storage and session storage.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Cookies We Use</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold text-foreground">Cookie / Storage</th>
                    <th className="p-3 text-left font-semibold text-foreground">Type</th>
                    <th className="p-3 text-left font-semibold text-foreground">Purpose</th>
                    <th className="p-3 text-left font-semibold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-mono">sb-*-auth-token</td>
                    <td className="p-3">Essential</td>
                    <td className="p-3">Supabase authentication session. Keeps you logged in.</td>
                    <td className="p-3">Session / 1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">theme</td>
                    <td className="p-3">Preference</td>
                    <td className="p-3">Remembers your light/dark theme preference.</td>
                    <td className="p-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">location-history</td>
                    <td className="p-3">Preference</td>
                    <td className="p-3">Stores recent location searches for faster access (localStorage).</td>
                    <td className="p-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">impersonation</td>
                    <td className="p-3">Essential (Admin)</td>
                    <td className="p-3">Enables super admin impersonation for support purposes.</td>
                    <td className="p-3">1 hour</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">__stripe_*</td>
                    <td className="p-3">Essential</td>
                    <td className="p-3">Set by Stripe during payment processing for fraud prevention.</td>
                    <td className="p-3">Varies</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">_vercel_*</td>
                    <td className="p-3">Performance</td>
                    <td className="p-3">Vercel hosting analytics and edge routing.</td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Cookie Categories</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p><strong>Essential cookies</strong> are required for the platform to function. They enable core features like authentication, security, and payment processing. These cannot be disabled without breaking the platform.</p>
            <p><strong>Preference cookies</strong> remember choices you make (theme, location history) to provide a personalized experience. Disabling them means the platform won&rsquo;t remember your preferences between visits.</p>
            <p><strong>Performance/analytics cookies</strong> help us understand how users interact with the platform so we can improve it. They collect aggregated, anonymous data.</p>
            <p>We do not use advertising or targeting cookies. We do not sell cookie data or use it for cross-site behavioral advertising.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">How to Control Cookies</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>You can manage cookies through your browser settings:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Chrome:</strong> Settings &rarr; Privacy and Security &rarr; Cookies and Other Site Data</li>
              <li><strong>Safari:</strong> Preferences &rarr; Privacy &rarr; Manage Website Data</li>
              <li><strong>Firefox:</strong> Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site Data</li>
              <li><strong>Edge:</strong> Settings &rarr; Cookies and Site Permissions</li>
            </ul>
            <p>You can also clear local storage and session storage through your browser&rsquo;s developer tools.</p>
            <p>Note: Blocking essential cookies will prevent you from logging in or using core platform features.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Third-Party Cookies</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Some cookies are set by third-party services we integrate with:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Stripe:</strong> Sets cookies for payment fraud detection. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe&rsquo;s Privacy Policy</a>.</li>
              <li><strong>Google Maps:</strong> May set cookies when the map is loaded. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google&rsquo;s Privacy Policy</a>.</li>
            </ul>
            <p>We do not control third-party cookies and recommend reviewing their respective privacy policies.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">Contact</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              For questions about our use of cookies, contact us at <strong>[PLACEHOLDER &mdash; Privacy Email]</strong> or see our full <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
