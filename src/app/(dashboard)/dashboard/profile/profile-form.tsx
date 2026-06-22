"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

export function ProfileForm({
  profile,
}: {
  profile: {
    full_name: string;
    phone: string;
    country: string;
    avatar_url: string;
  };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.success && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
          Profile updated successfully.
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={profile.full_name}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-foreground">
          Country
        </label>
        <input
          id="country"
          name="country"
          type="text"
          defaultValue={profile.country}
          placeholder="e.g. KE, US"
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
