"use client";

import { useState, useEffect, useTransition } from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, User } from "lucide-react";
import { holdBookingSlot, confirmBooking } from "@/lib/booking/actions";

interface Service {
  id: string;
  name: string;
  price_amount: number;
  currency: string;
  duration_minutes: number;
  payment_option: string;
}

interface StaffMember {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface SlotData {
  start: string;
  localTime: string;
  staffId: string;
  staffName: string;
}

interface AvailabilityResponse {
  slots: SlotData[];
  timezone: string;
  date: string;
}

interface Props {
  businessId: string;
  businessName: string;
  businessSlug: string;
  timezone: string;
  chargesEnabled: boolean;
  services: Service[];
  staffMembers: StaffMember[];
  source: "direct_link" | "marketplace";
  preselectedServiceId?: string;
}

export function BookingFlow({
  businessId,
  businessName,
  businessSlug,
  timezone,
  chargesEnabled,
  services,
  staffMembers,
  source,
  preselectedServiceId,
}: Props) {
  // Step state
  const [step, setStep] = useState(preselectedServiceId ? 2 : 1);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    preselectedServiceId && services.some((s) => s.id === preselectedServiceId)
      ? preselectedServiceId
      : null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"prepay" | "pay_at_store">("pay_at_store");
  const [clientNote, setClientNote] = useState("");

  // Availability data
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsTimezone, setSlotsTimezone] = useState(timezone);

  // Booking state
  const [isPending, startTransition] = useTransition();
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    bookingId?: string;
    error?: string;
  } | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedServiceId) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);

    fetch(
      `/api/availability?businessId=${businessId}&serviceId=${selectedServiceId}` +
        `&date=${selectedDate}${selectedStaffId ? `&staffId=${selectedStaffId}` : ""}`,
    )
      .then((res) => res.json())
      .then((data: AvailabilityResponse) => {
        setSlots(data.slots ?? []);
        setSlotsTimezone(data.timezone ?? timezone);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedServiceId, selectedStaffId, businessId, timezone]);

  // Reset downstream when service changes
  useEffect(() => {
    setSelectedStaffId(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
  }, [selectedServiceId]);

  // Determine payment options for the selected service
  const paymentOptions = (() => {
    if (!selectedService) return [];
    const opts: ("prepay" | "pay_at_store")[] = [];
    if ((selectedService.payment_option === "prepay" || selectedService.payment_option === "both") && chargesEnabled) {
      opts.push("prepay");
    }
    if (selectedService.payment_option === "pay_at_store" || selectedService.payment_option === "both") {
      opts.push("pay_at_store");
    }
    // If charges not enabled, only pay_at_store
    if (!chargesEnabled && opts.length === 0) {
      opts.push("pay_at_store");
    }
    return opts;
  })();

  // Auto-select payment method
  useEffect(() => {
    if (paymentOptions.length === 1) {
      setPaymentMethod(paymentOptions[0]);
    }
  }, [paymentOptions.length]);

  async function handleBook() {
    if (!selectedSlot || !selectedServiceId) return;

    startTransition(async () => {
      const result = await holdBookingSlot({
        businessId,
        serviceId: selectedServiceId,
        staffId: selectedStaffId || null,
        slotStart: selectedSlot.start,
        source,
        paymentMethod,
        clientNote: clientNote.trim(),
      });

      if (result.success && result.bookingId) {
        if (paymentMethod === "pay_at_store") {
          // REVIEW: For pay-at-store, confirm immediately (no Stripe step)
          const confirmResult = await confirmBooking(result.bookingId);
          setBookingResult(confirmResult.success
            ? { success: true, bookingId: result.bookingId }
            : { success: false, error: confirmResult.error });
        } else {
          // REVIEW: For prepay, this is where Stripe checkout would happen.
          // The booking is now held for 10 minutes. The payment step would:
          //   1. Create a Stripe PaymentIntent
          //   2. Show the Stripe Elements payment form
          //   3. On successful payment, call confirmBooking()
          //   4. On failure/abandonment, the hold expires automatically
          // For now, confirm immediately as a stub.
          const confirmResult = await confirmBooking(result.bookingId);
          setBookingResult(confirmResult.success
            ? { success: true, bookingId: result.bookingId }
            : { success: false, error: confirmResult.error });
        }
      } else {
        setBookingResult(result);
      }
    });
  }

  // ── Booking confirmed screen ────────────────────────────────────
  if (bookingResult?.success) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground font-heading">
          Booking confirmed!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your appointment at {businessName} has been booked.
        </p>
        {selectedSlot && (
          <div className="mt-4 inline-block rounded-xl border border-border bg-card px-6 py-4 text-left">
            <p className="font-medium text-foreground">{selectedService?.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDisplayDate(selectedDate!)} at {formatTime12h(selectedSlot.localTime)} ({slotsTimezone.replace(/_/g, " ")})
            </p>
            <p className="text-sm text-muted-foreground">
              with {selectedSlot.staffName}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {formatPrice(selectedService?.price_amount ?? 0, selectedService?.currency ?? "USD")}
              {paymentMethod === "pay_at_store" && (
                <span className="ml-2 text-muted-foreground font-normal">— pay at store</span>
              )}
            </p>
          </div>
        )}
        <div className="mt-6">
          <a
            href={`/b/${businessSlug}`}
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Back to {businessName}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Select service */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground font-heading">
          1. Choose a Service
        </h2>
        <div className="space-y-3">
          {services.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                selectedServiceId === s.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  checked={selectedServiceId === s.id}
                  onChange={() => {
                    setSelectedServiceId(s.id);
                    setStep(2);
                  }}
                  className="h-4 w-4 text-primary focus:ring-ring"
                />
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {s.duration_minutes} min
                  </p>
                </div>
              </div>
              <span className="font-semibold text-foreground">
                {formatPrice(s.price_amount, s.currency)}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Step 2: Select staff (optional) */}
      {step >= 2 && staffMembers.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground font-heading">
            2. Choose a Professional
            <span className="ml-2 text-sm font-normal text-muted-foreground">(optional)</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                selectedStaffId === null
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="staff"
                value=""
                checked={selectedStaffId === null}
                onChange={() => {
                  setSelectedStaffId(null);
                  setStep(3);
                }}
                className="h-4 w-4 text-primary focus:ring-ring"
              />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Any available</span>
            </label>
            {staffMembers.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                  selectedStaffId === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="staff"
                  value={s.id}
                  checked={selectedStaffId === s.id}
                  onChange={() => {
                    setSelectedStaffId(s.id);
                    setStep(3);
                  }}
                  className="h-4 w-4 text-primary focus:ring-ring"
                />
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(s.display_name ?? "?").charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">{s.display_name}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Pick date & time */}
      {step >= 2 && selectedServiceId && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground font-heading">
            {staffMembers.length > 0 ? "3" : "2"}. Pick a Date & Time
          </h2>

          {/* Mini calendar */}
          <MiniCalendar
            year={calendarMonth.year}
            month={calendarMonth.month}
            selectedDate={selectedDate}
            timezone={timezone}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setStep(3);
            }}
            onChangeMonth={(y, m) => setCalendarMonth({ year: y, month: m })}
          />

          {/* Timezone label */}
          <p className="mt-2 text-xs text-muted-foreground">
            Times shown in {slotsTimezone.replace(/_/g, " ")} time
          </p>

          {/* Time slots */}
          {selectedDate && (
            <div className="mt-4">
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading available times...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
                  <Calendar className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No available times on this date. Try another day.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(4);
                      }}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        selectedSlot?.start === slot.start
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      {formatTime12h(slot.localTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Step 4: Confirm */}
      {step >= 4 && selectedSlot && selectedService && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground font-heading">
            {staffMembers.length > 0 ? "4" : "3"}. Confirm Booking
          </h2>

          {/* Summary card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-medium text-foreground">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm font-medium text-foreground">
                {formatDisplayDate(selectedDate!)} at {formatTime12h(selectedSlot.localTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Professional</span>
              <span className="text-sm font-medium text-foreground">{selectedSlot.staffName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm font-medium text-foreground">{selectedService.duration_minutes} min</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-semibold text-foreground">
                {formatPrice(selectedService.price_amount, selectedService.currency)}
              </span>
            </div>
          </div>

          {/* Payment method */}
          {paymentOptions.length > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Payment method</p>
              <div className="flex gap-3">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex-1 cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                      paymentMethod === opt
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt}
                      checked={paymentMethod === opt}
                      onChange={() => setPaymentMethod(opt)}
                      className="sr-only"
                    />
                    {opt === "prepay" ? "Pay online" : "Pay at store"}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Client note */}
          <div className="mt-4">
            <label className="text-sm font-medium text-foreground">
              Note for the business
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Any preferences or requests..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Error message */}
          {bookingResult?.error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{bookingResult.error}</p>
            </div>
          )}

          {/* Book button */}
          <button
            onClick={handleBook}
            disabled={isPending}
            className="mt-4 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking...
              </span>
            ) : paymentMethod === "prepay" ? (
              `Pay ${formatPrice(selectedService.price_amount, selectedService.currency)} & Book`
            ) : (
              "Confirm Booking"
            )}
          </button>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            {paymentMethod === "pay_at_store"
              ? "You'll pay when you arrive at the venue."
              : "Secure payment processing powered by Stripe."}
          </p>
        </section>
      )}
    </div>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────

function MiniCalendar({
  year,
  month,
  selectedDate,
  timezone,
  onSelectDate,
  onChangeMonth,
}: {
  year: number;
  month: number;
  selectedDate: string | null;
  timezone: string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}) {
  const now = new Date();
  const todayStr = formatDateLocal(now);
  const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60_000);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun

  const monthName = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(dateStr);
  }

  const canPrev = !(year === now.getFullYear() && month === now.getMonth());

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => {
            const prev = new Date(year, month - 1, 1);
            onChangeMonth(prev.getFullYear(), prev.getMonth());
          }}
          disabled={!canPrev}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">{monthName}</span>
        <button
          onClick={() => {
            const next = new Date(year, month + 1, 1);
            onChangeMonth(next.getFullYear(), next.getMonth());
          }}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center">
        {days.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;

          const dateObj = new Date(dateStr + "T12:00:00");
          const isPast = dateStr < todayStr;
          const isBeyondWindow = dateObj > maxDate;
          const isDisabled = isPast || isBeyondWindow;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const dayNum = dateObj.getDate();

          return (
            <button
              key={dateStr}
              onClick={() => !isDisabled && onSelectDate(dateStr)}
              disabled={isDisabled}
              className={`mx-auto my-0.5 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : isToday
                    ? "border border-primary text-primary font-medium"
                    : isDisabled
                      ? "text-muted-foreground/40"
                      : "text-foreground hover:bg-primary/10"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}
