"use client";

import { useActionState } from "react";
import { addException, type ScheduleFormState } from "./actions";

export function ExceptionForm() {
  const [state, action, pending] = useActionState<ScheduleFormState, FormData>(
    addException,
    null,
  );

  return (
    <form action={action} className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Add Time Off / Block</h3>

      {state?.error && (
        <div className="mb-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-3 rounded-lg bg-success/10 p-2 text-xs text-success">
          Exception added.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="block text-xs font-medium text-muted-foreground">
            Start
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="ends_at" className="block text-xs font-medium text-muted-foreground">
            End
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="reason" className="block text-xs font-medium text-muted-foreground">
          Reason (optional)
        </label>
        <input
          id="reason"
          name="reason"
          type="text"
          placeholder="e.g. Vacation, Doctor's appointment"
          className="mt-1 block w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_available"
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">
            Mark as extra availability (not a block)
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
