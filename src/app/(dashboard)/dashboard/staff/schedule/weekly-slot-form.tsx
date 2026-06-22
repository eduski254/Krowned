"use client";

import { useActionState } from "react";
import { addWeeklySlot, type ScheduleFormState } from "./actions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WeeklySlotForm() {
  const [state, action, pending] = useActionState<ScheduleFormState, FormData>(
    addWeeklySlot,
    null,
  );

  return (
    <form action={action} className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Add / Update Day</h3>

      {state?.error && (
        <div className="mb-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-3 rounded-lg bg-success/10 p-2 text-xs text-success">
          Schedule updated.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="day_of_week" className="block text-xs font-medium text-muted-foreground">
            Day
          </label>
          <select
            id="day_of_week"
            name="day_of_week"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DAY_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="start_time" className="block text-xs font-medium text-muted-foreground">
            Start
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            required
            defaultValue="09:00"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-xs font-medium text-muted-foreground">
            End
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            required
            defaultValue="17:00"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Set"}
          </button>
        </div>
      </div>
    </form>
  );
}
