import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailPreferences } from "./email-prefs";

const EMAIL_PREF_CONFIG = [
  {
    eventType: "booking_confirmation",
    label: "Booking confirmations",
    description: "When your booking is confirmed, rescheduled, or cancelled",
    essential: true,
  },
  {
    eventType: "new_booking_owner",
    label: "New booking alerts",
    description: "When a client books an appointment (business owners)",
    essential: true,
  },
  {
    eventType: "booking_cancelled_owner",
    label: "Cancellation alerts",
    description: "When a client cancels a booking (business owners)",
    essential: true,
  },
  {
    eventType: "staff_invitation",
    label: "Staff invitations",
    description: "When you're invited to join a business as staff",
    essential: true,
  },
  {
    eventType: "new_review_owner",
    label: "New reviews",
    description: "When a client leaves a review (business owners)",
    essential: false,
  },
];

export default async function ClientSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch existing preferences
  const { data: savedPrefs } = await supabase
    .from("notification_preferences")
    .select("event_type, email")
    .eq("user_id", user.id);

  const prefsMap = new Map(
    (savedPrefs ?? []).map((p) => [p.event_type, p.email]),
  );

  const preferences = EMAIL_PREF_CONFIG.map((cfg) => ({
    ...cfg,
    // Essential always true; optional defaults to true (opt-out model)
    enabled: cfg.essential ? true : (prefsMap.get(cfg.eventType) ?? true),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold font-heading text-foreground">
        Settings
      </h1>

      <div className="max-w-xl space-y-6">
        {/* Email preferences */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Email Notifications
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Choose which emails you receive from Krowned.
          </p>
          <EmailPreferences preferences={preferences} />
        </div>

        {/* Account */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-4">
            <a
              href="/reset-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Change password
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
