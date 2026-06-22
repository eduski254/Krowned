export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

      <div className="mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Information We Collect</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We collect information you provide directly: name, email, phone, and payment details.
            We also collect usage data such as pages visited, bookings made, and device information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We use your information to provide and improve our services, process bookings and payments,
            send transactional notifications, and personalize your experience.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Data Sharing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We share data with service providers (Stripe for payments, Supabase for data storage)
            and with businesses you book with. We never sell your personal data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Your Rights</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You can access, update, or delete your personal information at any time through your
            account settings or by contacting us at hello@zawadi.com.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For privacy-related inquiries, contact us at hello@zawadi.com.
          </p>
        </section>
      </div>
    </div>
  );
}
