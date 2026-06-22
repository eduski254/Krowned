import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export default async function ClientSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="max-w-xl space-y-6">
        {/* Notification preferences */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Notification Preferences
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage how you receive notifications about bookings and updates.
          </p>
          <div className="mt-4 space-y-3">
            {["Booking confirmations", "Booking reminders", "Review requests", "Promotions"].map(
              (label) => (
                <label
                  key={label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-foreground">{label}</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                </label>
              ),
            )}
          </div>
        </div>

        {/* Account */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email}
          </p>
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
