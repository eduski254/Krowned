"use client";

import { useState, useTransition } from "react";
import { X, CalendarClock } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { cancelBooking } from "@/lib/booking/cancel-action";
import { rescheduleBooking } from "@/lib/booking/reschedule-action";
import { localToUtcIso } from "@/lib/format-date";

export function OwnerCancelButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span className="text-xs font-medium text-destructive">Cancelled</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <button
        onClick={() => {
          if (!confirm("Cancel this booking? The client will be notified."))
            return;
          setError(null);
          startTransition(async () => {
            const result = await cancelBooking(bookingId);
            if (result.success) {
              setDone(true);
            } else {
              setError(result.error ?? "Failed");
            }
          });
        }}
        disabled={isPending}
        className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50 transition-colors min-h-[36px]"
      >
        {isPending ? (
          <Spinner className="h-3 w-3" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Cancel
      </button>
    </div>
  );
}

export function RescheduleButton({ bookingId, timezone }: { bookingId: string; timezone: string }) {
  const [open, setOpen] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span className="text-xs font-medium text-success">Rescheduled</span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <CalendarClock className="h-3 w-3" />
        Reschedule
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        min={new Date().toISOString().slice(0, 16)}
        className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <button
        onClick={() => {
          if (!dateTime) {
            setError("Pick a new date & time");
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await rescheduleBooking({
              bookingId,
              newStartsAt: localToUtcIso(dateTime, timezone),
            });
            if (result.success) {
              setDone(true);
              setOpen(false);
            } else {
              setError(result.error ?? "Failed");
            }
          });
        }}
        disabled={isPending || !dateTime}
        className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Spinner className="h-3 w-3" /> : "Confirm"}
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setDateTime("");
          setError(null);
        }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
