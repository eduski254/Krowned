"use client";

import { useState, useTransition } from "react";
import { X, Star, Send, CalendarClock } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { cancelBooking } from "@/lib/booking/cancel-action";
import { submitReview } from "@/lib/booking/review-action";
import { rescheduleBooking } from "@/lib/booking/reschedule-action";
import { localToUtcIso } from "@/lib/format-date";

export function CancelButton({ bookingId }: { bookingId: string }) {
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
          if (!confirm("Cancel this booking?")) return;
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
        className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50 transition-colors"
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

export function ReviewButton({
  bookingId,
  hasReview,
}: {
  bookingId: string;
  hasReview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(hasReview);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span className="text-xs font-medium text-success">Reviewed</span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Star className="h-3 w-3" />
        Leave review
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 space-y-3">
      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                s <= (hoverRating || rating)
                  ? "fill-warning text-warning"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {rating}/5
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={2}
        maxLength={2000}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (rating === 0) {
              setError("Please select a rating");
              return;
            }
            setError(null);
            startTransition(async () => {
              const result = await submitReview({
                bookingId,
                rating,
                comment: comment.trim(),
              });
              if (result.success) {
                setDone(true);
                setOpen(false);
              } else {
                setError(result.error ?? "Failed");
              }
            });
          }}
          disabled={isPending || rating === 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Spinner className="h-3 w-3" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Submit
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setRating(0);
            setComment("");
            setError(null);
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
