import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

      <div className="mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            By using Layd, you agree to these terms. If you do not agree, do not use the platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. User Accounts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You are responsible for maintaining the security of your account and all activity
            that occurs under it. One account per person; no duplicate accounts.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Bookings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Layd facilitates bookings between clients and service providers. We are not a party to
            the service itself. Cancellation policies are set by individual businesses.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Payments</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Payments are processed securely through Stripe. Platform fees apply to online payments.
            Tips pass through 100% to the service provider. All amounts are in the currency
            specified at booking time.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Content and Reviews</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reviews must be honest and related to a completed booking. We reserve the right to
            moderate or remove content that violates our guidelines.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">6. Limitation of Liability</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Layd is provided &ldquo;as is&rdquo; without warranty. We are not liable for the
            quality of services provided by businesses listed on the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
