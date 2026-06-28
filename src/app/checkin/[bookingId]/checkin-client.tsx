"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, User, AlertCircle, UserCheck } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { checkInBooking } from "@/lib/booking/checkin-action";

interface Props {
  bookingId: string;
  status: string;
  clientName: string;
  serviceName: string;
  durationMinutes: number;
  staffName: string;
  startsAt: string;
  serviceAmount: number | null;
  currency: string | null;
  checkedInAt: string | null;
}

export function CheckInClient({
  bookingId,
  status,
  clientName,
  serviceName,
  durationMinutes,
  staffName,
  startsAt,
  serviceAmount,
  currency,
  checkedInAt: initialCheckedIn,
}: Props) {
  const [checkedInAt, setCheckedInAt] = useState(initialCheckedIn);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startDate = new Date(startsAt);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const bookingRef = "ZW-" + bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();

  const handleCheckIn = () => {
    setError(null);
    startTransition(async () => {
      const result = await checkInBooking({ bookingId });
      if (result.error) {
        setError(result.error);
        if (result.checkedInAt) setCheckedInAt(result.checkedInAt);
      } else if (result.success) {
        setCheckedInAt(result.checkedInAt!);
      }
    });
  };

  const isCheckedIn = !!checkedInAt;
  const canCheckIn = status === "confirmed" && !isCheckedIn;

  return (
    <div className="mt-6 space-y-6">
      {/* Status banner */}
      {isCheckedIn ? (
        <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4">
          <UserCheck className="h-6 w-6 text-success" />
          <div>
            <p className="font-semibold text-success">Checked in</p>
            <p className="text-xs text-success/80">
              {new Date(checkedInAt!).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              &middot;{" "}
              {new Date(checkedInAt!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      ) : status !== "confirmed" ? (
        <div className="flex items-center gap-3 rounded-xl bg-warning/10 p-4">
          <AlertCircle className="h-6 w-6 text-warning" />
          <div>
            <p className="font-semibold text-warning">Cannot check in</p>
            <p className="text-xs text-warning/80">
              Booking status is &ldquo;{status}&rdquo; — only confirmed bookings can be checked in.
            </p>
          </div>
        </div>
      ) : null}

      {/* Booking details card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between bg-muted px-5 py-3">
          <span className="text-xs font-medium text-muted-foreground">Reference</span>
          <span className="font-mono text-sm font-bold text-foreground tracking-wider">
            {bookingRef}
          </span>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Client</span>
            <span className="text-sm font-medium text-foreground">{clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="text-sm font-medium text-foreground">{serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Date & Time</span>
            <span className="text-sm font-medium text-foreground">
              {dateStr} at {timeStr}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm text-foreground">
              <Clock className="inline h-3 w-3 mr-0.5" />
              {durationMinutes} min
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Professional</span>
            <span className="text-sm text-foreground">
              <User className="inline h-3 w-3 mr-0.5" />
              {staffName}
            </span>
          </div>
          {serviceAmount != null && (
            <>
              <hr className="border-border" />
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-semibold text-foreground">
                  {(serviceAmount / 100).toFixed(2)} {currency?.toUpperCase() ?? ""}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Check-in button */}
      {canCheckIn && (
        <button
          onClick={handleCheckIn}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <>
              <Spinner className="h-4 w-4" />
              Checking in...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Mark as arrived
            </>
          )}
        </button>
      )}
    </div>
  );
}
