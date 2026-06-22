"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inviteStaff, type StaffFormState } from "../actions";

export default function InviteStaffPage() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(
    inviteStaff,
    null,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Invite Staff</h1>

      <div className="max-w-xl">
        {state?.error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="staff@example.com"
            />
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-foreground">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Sarah M."
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              Title (optional)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Hair Stylist"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send Invite"}
            </button>
            <Link
              href="/dashboard/business/staff"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
