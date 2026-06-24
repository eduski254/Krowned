"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, User, CalendarPlus, MapPin, ArrowRight, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  businessAddress?: string;
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
  businessAddress,
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
      <BookingConfirmation
        bookingId={bookingResult.bookingId!}
        businessName={businessName}
        businessSlug={businessSlug}
        businessAddress={businessAddress}
        timezone={slotsTimezone}
        service={selectedService!}
        slot={selectedSlot!}
        date={selectedDate!}
        paymentMethod={paymentMethod}
      />
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

// ── Booking Confirmation ──────────────────────────────────────────

function BookingConfirmation({
  bookingId,
  businessName,
  businessSlug,
  businessAddress,
  timezone,
  service,
  slot,
  date,
  paymentMethod,
}: {
  bookingId: string;
  businessName: string;
  businessSlug: string;
  businessAddress?: string;
  timezone: string;
  service: Service;
  slot: SlotData;
  date: string;
  paymentMethod: "prepay" | "pay_at_store";
}) {
  const [copied, setCopied] = useState(false);

  const bookingRef = useMemo(() => deriveBookingRef(bookingId), [bookingId]);

  const startDt = new Date(slot.start);
  const endDt = new Date(startDt.getTime() + service.duration_minutes * 60_000);

  const icsBlob = useMemo(
    () => generateICS({
      title: `${service.name} @ ${businessName}`,
      start: startDt,
      end: endDt,
      timezone,
      location: businessAddress,
      description: `Booking ref: ${bookingRef}\nWith: ${slot.staffName}\nService: ${service.name} (${service.duration_minutes} min)\nTotal: ${formatPrice(service.price_amount, service.currency)}${paymentMethod === "pay_at_store" ? " — pay at store" : ""}`,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingId],
  );

  const googleCalUrl = useMemo(
    () => buildGoogleCalUrl({
      title: `${service.name} @ ${businessName}`,
      start: startDt,
      end: endDt,
      location: businessAddress,
      description: `Booking ref: ${bookingRef}. With ${slot.staffName}.`,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingId],
  );

  const mapsUrl = businessAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`
    : null;

  // REVIEW: When Stripe is integrated, show payment receipt details here
  // (transaction ID, amount charged, last-4 of card). For prepay bookings,
  // the receipt will come from Stripe; for pay-at-store, show "Pay at venue."

  // REVIEW: When Resend (email) is integrated, trigger a confirmation email
  // from the server action that calls confirmBooking(). The email should
  // include: booking ref, .ics attachment, QR code image, and business contact.

  const copyRef = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-8">
      {/* Success icon + heading */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground font-heading sm:text-3xl">
          You&apos;re all set!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your appointment at <span className="font-medium text-foreground">{businessName}</span> is confirmed.
        </p>
      </div>

      {/* Booking summary card */}
      <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
        {/* Ref header */}
        <div className="flex items-center justify-between bg-muted px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Booking reference</span>
            <span className="font-mono text-sm font-bold text-foreground tracking-wider">{bookingRef}</span>
          </div>
          <button
            onClick={copyRef}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            aria-label="Copy reference"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="text-sm font-medium text-foreground">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Date & Time</span>
            <span className="text-sm font-medium text-foreground">
              {formatDisplayDate(date)} at {formatTime12h(slot.localTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Timezone</span>
            <span className="text-sm text-foreground">{timezone.replace(/_/g, " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Professional</span>
            <span className="text-sm font-medium text-foreground">{slot.staffName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm text-foreground">{service.duration_minutes} min</span>
          </div>
          {businessAddress && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm text-foreground text-right max-w-[60%]">{businessAddress}</span>
            </div>
          )}
          <hr className="border-border" />
          <div className="flex justify-between">
            <span className="font-medium text-foreground">Total</span>
            <div className="text-right">
              <span className="font-semibold text-foreground">
                {formatPrice(service.price_amount, service.currency)}
              </span>
              {paymentMethod === "pay_at_store" && (
                <p className="text-xs text-muted-foreground mt-0.5">Pay at venue</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR code + calendar row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* QR code */}
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-5">
          <div className="rounded-lg bg-white p-3">
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${bookingId}`}
              size={120}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Show this at your appointment
          </p>
        </div>

        {/* Add to calendar */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-1">Add to calendar</p>
          <a
            href={URL.createObjectURL(icsBlob)}
            download={`zawadi-booking-${bookingRef}.ics`}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <CalendarPlus className="h-4 w-4 text-primary" />
            Download .ics
            <span className="ml-auto text-xs text-muted-foreground">Apple / Outlook</span>
          </a>
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Calendar className="h-4 w-4 text-primary" />
            Google Calendar
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <a
          href="/dashboard/bookings"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View my bookings
        </a>
        <div className="grid gap-3 sm:grid-cols-2">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Get directions
            </a>
          )}
          <a
            href={`/b/${businessSlug}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Back to {businessName}
          </a>
        </div>
      </div>
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

/** Derive a short human-readable booking ref from UUID (8 chars, uppercased) */
function deriveBookingRef(bookingId: string): string {
  // Take first 8 hex chars of UUID, uppercase
  return "ZW-" + bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Format a Date to ICS YYYYMMDDTHHMMSSZ format (UTC) */
function toICSDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Format a UTC Date into a local YYYYMMDDTHHMMSS string for a given IANA timezone.
 * Uses Intl.DateTimeFormat for DST-correct conversion.
 */
function toICSDateLocal(date: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

/**
 * Generate a VCALENDAR .ics Blob.
 *
 * Timezone handling: DTSTART/DTEND use TZID parameter with the business
 * timezone (IANA name) and local-time values. A VTIMEZONE block is included
 * with the TZID so that compliant calendar apps (Apple, Google, Outlook)
 * resolve the correct UTC offset automatically. This ensures the event
 * lands at the right local time regardless of the user's own timezone.
 */
function generateICS({
  title,
  start,
  end,
  timezone,
  location,
  description,
}: {
  title: string;
  start: Date;
  end: Date;
  timezone: string;
  location?: string;
  description?: string;
}): Blob {
  const uid = `${start.getTime()}-${Math.random().toString(36).slice(2)}@zawadi.com`;
  const localStart = toICSDateLocal(start, timezone);
  const localEnd = toICSDateLocal(end, timezone);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zawadi//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // Minimal VTIMEZONE — the TZID is an IANA name, which all modern
    // calendar apps resolve natively. The STANDARD block is a fallback
    // for strict parsers that require a VTIMEZONE definition.
    "BEGIN:VTIMEZONE",
    `TZID:${timezone}`,
    "BEGIN:STANDARD",
    `DTSTART:19700101T000000`,
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    `TZNAME:${timezone}`,
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `DTSTART;TZID=${timezone}:${localStart}`,
    `DTEND;TZID=${timezone}:${localEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    `UID:${uid}`,
    `DTSTAMP:${toICSDateUTC(new Date())}`,
  ];
  if (location) lines.push(`LOCATION:${escapeICS(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeICS(description)}`);
  lines.push(`X-WR-TIMEZONE:${timezone}`);
  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");
  return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Build a Google Calendar "add event" URL */
function buildGoogleCalUrl({
  title,
  start,
  end,
  location,
  description,
}: {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (location) params.set("location", location);
  if (description) params.set("details", description);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
