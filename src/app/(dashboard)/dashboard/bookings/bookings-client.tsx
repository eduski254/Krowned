"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { CancelButton, RescheduleButton, ReviewButton } from "./booking-actions";

export interface BookingItem {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_method: string;
  service_amount: number | null;
  currency: string | null;
  serviceName: string;
  businessName: string;
  businessTimezone: string;
  staffName: string | null;
}

type ViewMode = "list" | "grid" | "calendar";

const VIEW_ICONS = {
  list: List,
  grid: LayoutGrid,
  calendar: CalendarIcon,
} as const;

function formatDate(utc: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(utc));
}

function formatTime(utc: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(utc));
}

function formatTimeRange(start: string, end: string, tz: string) {
  return `${formatTime(start, tz)} – ${formatTime(end, tz)}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "completed" && "bg-success/10 text-success",
        status === "cancelled" && "bg-destructive/10 text-destructive",
        status !== "completed" && status !== "cancelled" && "bg-primary/10 text-primary",
      )}
    >
      {status}
    </span>
  );
}

export function BookingsClient({
  bookings,
  reviewedIds,
}: {
  bookings: BookingItem[];
  reviewedIds: string[];
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const reviewedSet = useMemo(() => new Set(reviewedIds), [reviewedIds]);

  const now = useMemo(() => new Date(), []);

  const upcoming = useMemo(
    () => bookings.filter((b) => new Date(b.starts_at) >= now && b.status !== "cancelled"),
    [bookings, now],
  );
  const past = useMemo(
    () => bookings.filter((b) => new Date(b.starts_at) < now || b.status === "cancelled"),
    [bookings, now],
  );

  const activeBookings = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          My Bookings
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {(["list", "grid", "calendar"] as const).map((mode) => {
              const Icon = VIEW_ICONS[mode];
              return (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    view === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label={`${mode} view`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          onClick={() => setTab("upcoming")}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "upcoming"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "past"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Past ({past.length})
        </button>
      </div>

      {activeBookings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">
            {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "upcoming"
              ? "Book a service to get started."
              : "Your completed bookings will show here."}
          </p>
          {tab === "upcoming" && (
            <Link
              href="/explore"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Find services
            </Link>
          )}
        </div>
      ) : view === "list" ? (
        <ListView bookings={activeBookings} reviewedSet={reviewedSet} isUpcoming={tab === "upcoming"} />
      ) : view === "grid" ? (
        <GridView bookings={activeBookings} reviewedSet={reviewedSet} isUpcoming={tab === "upcoming"} />
      ) : (
        <CalendarView bookings={activeBookings} reviewedSet={reviewedSet} isUpcoming={tab === "upcoming"} />
      )}
    </div>
  );
}

// ── List View ──

function ListView({
  bookings,
  reviewedSet,
  isUpcoming,
}: {
  bookings: BookingItem[];
  reviewedSet: Set<string>;
  isUpcoming: boolean;
}) {
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <ListCard key={b.id} booking={b} reviewedSet={reviewedSet} isUpcoming={isUpcoming} />
      ))}
    </div>
  );
}

function ListCard({
  booking: b,
  reviewedSet,
  isUpcoming,
}: {
  booking: BookingItem;
  reviewedSet: Set<string>;
  isUpcoming: boolean;
}) {
  const isFuture = new Date(b.starts_at) > new Date();
  const canCancel = b.status === "confirmed" && isFuture;
  const canReview = b.status === "completed";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{b.serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {b.businessName}
            {b.staffName ? ` — ${b.staffName}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(b.starts_at, b.businessTimezone)} at{" "}
            {formatTime(b.starts_at, b.businessTimezone)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={b.status} />
          {b.service_amount != null && (
            <span className="text-sm font-semibold text-foreground">
              {(b.service_amount / 100).toFixed(2)} {b.currency?.toUpperCase()}
            </span>
          )}
          {canCancel && (
            <RescheduleButton bookingId={b.id} timezone={b.businessTimezone} />
          )}
          {canCancel && <CancelButton bookingId={b.id} />}
        </div>
      </div>
      {canReview && (
        <div className="mt-2">
          <ReviewButton bookingId={b.id} hasReview={reviewedSet.has(b.id)} />
        </div>
      )}
    </div>
  );
}

// ── Grid View ──

function GridView({
  bookings,
  reviewedSet,
  isUpcoming,
}: {
  bookings: BookingItem[];
  reviewedSet: Set<string>;
  isUpcoming: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((b) => {
        const isFuture = new Date(b.starts_at) > new Date();
        const canCancel = b.status === "confirmed" && isFuture;
        const canReview = b.status === "completed";

        return (
          <div
            key={b.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-3 flex items-start justify-between">
              <StatusBadge status={b.status} />
              {b.service_amount != null && (
                <span className="text-sm font-bold text-foreground">
                  ${(b.service_amount / 100).toFixed(2)}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-foreground">{b.serviceName}</h3>

            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{b.businessName}</span>
              </div>
              {b.staffName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{b.staffName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatDate(b.starts_at, b.businessTimezone)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatTimeRange(b.starts_at, b.ends_at, b.businessTimezone)}</span>
              </div>
            </div>

            <div className="mt-auto pt-3">
              {canCancel && (
                <div className="flex items-center gap-2">
                  <RescheduleButton bookingId={b.id} timezone={b.businessTimezone} />
                  <CancelButton bookingId={b.id} />
                </div>
              )}
              {canReview && (
                <ReviewButton bookingId={b.id} hasReview={reviewedSet.has(b.id)} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar View ──

function CalendarView({
  bookings,
  reviewedSet,
  isUpcoming,
}: {
  bookings: BookingItem[];
  reviewedSet: Set<string>;
  isUpcoming: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (bookings.length > 0) {
      const first = new Date(bookings[0].starts_at);
      return new Date(first.getFullYear(), first.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  // Group bookings by local date (YYYY-MM-DD in their business timezone)
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingItem[]>();
    for (const b of bookings) {
      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: b.businessTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(b.starts_at));
      const list = map.get(dateKey) ?? [];
      list.push(b);
      map.set(dateKey, list);
    }
    return map;
  }, [bookings]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const prevMonth = () =>
    setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(year, month + 1, 1));

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) ?? []) : [];

  return (
    <div>
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-t border-l border-border rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="border-b border-r border-border bg-muted/30 min-h-[60px] sm:min-h-[80px]"
              />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayBookings = bookingsByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const hasBookings = dayBookings.length > 0;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              className={clsx(
                "border-b border-r border-border p-1.5 text-left transition-colors min-h-[60px] sm:min-h-[80px]",
                isSelected
                  ? "bg-primary/5"
                  : hasBookings
                    ? "bg-card hover:bg-muted/50"
                    : "bg-card/50 hover:bg-muted/30",
              )}
            >
              <span
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                  !isToday && "text-foreground",
                )}
              >
                {day}
              </span>
              {hasBookings && (
                <div className="mt-0.5 space-y-0.5">
                  {dayBookings.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      className={clsx(
                        "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                        b.status === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : b.status === "completed"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span className="hidden sm:inline">
                        {formatTime(b.starts_at, b.businessTimezone)}{" "}
                      </span>
                      {b.serviceName}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{dayBookings.length - 2} more
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className="mt-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(new Date(selectedDate + "T12:00:00"))}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <ListCard
                  key={b.id}
                  booking={b}
                  reviewedSet={reviewedSet}
                  isUpcoming={isUpcoming}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
