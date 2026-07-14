"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Sparkles,
  Plus,
} from "lucide-react";
import { OwnerCancelButton, RescheduleButton } from "./calendar-actions";
import { NewBookingModal } from "./new-booking-modal";
import { createClient } from "@/lib/supabase/client";

export interface CalendarBooking {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  serviceName: string;
  staffName: string;
  clientName: string;
}

interface Props {
  businessId: string;
  timezone: string;
  initialBookings: CalendarBooking[];
  services: { id: string; name: string; duration_minutes: number; price_amount: number; currency: string }[];
  staffMembers: { id: string; display_name: string }[];
}

type ViewMode = "list" | "grid" | "calendar";

function formatDate(utc: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
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
        status === "confirmed" && "bg-success/10 text-success",
        status === "completed" && "bg-success/10 text-success",
        status === "cancelled" && "bg-destructive/10 text-destructive",
        status === "pending_hold" && "bg-warning/10 text-warning",
        !["confirmed", "completed", "cancelled", "pending_hold"].includes(status) &&
          "bg-primary/10 text-primary",
      )}
    >
      {status === "pending_hold" ? "pending" : status}
    </span>
  );
}

export function CalendarClient({
  businessId,
  timezone,
  initialBookings,
  services,
  staffMembers,
}: Props) {
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [view, setView] = useState<ViewMode>("list");
  const [showModal, setShowModal] = useState(false);
  const [newBookingIds, setNewBookingIds] = useState<Set<string>>(new Set());

  // Realtime subscription for new bookings
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`biz-bookings:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as {
              id: string;
              starts_at: string;
              ends_at: string;
              status: string;
              source: string;
              service_id: string;
              staff_id: string | null;
              client_id: string | null;
              contact_id: string | null;
            };

            // Fetch related names
            const [svcRes, staffRes, clientRes, contactRes] = await Promise.all([
              supabase.from("services").select("name").eq("id", row.service_id).single(),
              row.staff_id
                ? supabase.from("staff").select("display_name").eq("id", row.staff_id).single()
                : Promise.resolve({ data: null }),
              row.client_id
                ? supabase.from("profiles").select("full_name").eq("id", row.client_id).single()
                : Promise.resolve({ data: null }),
              row.contact_id
                ? supabase.from("business_contacts").select("name").eq("id", row.contact_id).single()
                : Promise.resolve({ data: null }),
            ]);

            const newBooking: CalendarBooking = {
              id: row.id,
              starts_at: row.starts_at,
              ends_at: row.ends_at,
              status: row.status,
              source: row.source,
              serviceName: svcRes.data?.name ?? "Service",
              staffName: (staffRes.data as any)?.display_name ?? "Unassigned",
              clientName:
                (clientRes.data as any)?.full_name ??
                (contactRes.data as any)?.name ??
                "Client",
            };

            setBookings((prev) => {
              const exists = prev.some((b) => b.id === newBooking.id);
              if (exists) return prev;
              const updated = [...prev, newBooking].sort(
                (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
              );
              return updated;
            });

            // Mark as new for highlight animation
            setNewBookingIds((prev) => new Set(prev).add(row.id));
            setTimeout(() => {
              setNewBookingIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
              });
            }, 5000);
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as { id: string; status: string; starts_at: string; ends_at: string };
            setBookings((prev) =>
              prev.map((b) =>
                b.id === row.id
                  ? { ...b, status: row.status, starts_at: row.starts_at, ends_at: row.ends_at }
                  : b,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { id: string };
            setBookings((prev) => prev.filter((b) => b.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  // Next upcoming booking
  const now = useMemo(() => new Date(), []);
  const nextBooking = useMemo(() => {
    return bookings.find(
      (b) => new Date(b.starts_at) >= now && b.status !== "cancelled",
    );
  }, [bookings, now]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled"),
    [bookings],
  );

  const handleCreated = useCallback(() => {
    // Realtime will pick it up, but also refresh for good measure
    setShowModal(false);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Calendar & Bookings
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {(["list", "grid", "calendar"] as const).map((mode) => {
              const Icon =
                mode === "list" ? List : mode === "grid" ? LayoutGrid : CalendarIcon;
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
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Next upcoming highlight */}
      {nextBooking && (
        <div className="mb-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Next up
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">{nextBooking.serviceName}</p>
              <p className="text-sm text-muted-foreground">
                {nextBooking.clientName} — {nextBooking.staffName}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-foreground">
                {formatDate(nextBooking.starts_at, timezone)}{" "}
                {formatTime(nextBooking.starts_at, timezone)}
              </span>
              <StatusBadge status={nextBooking.status} />
              {nextBooking.status === "confirmed" && (
                <>
                  <RescheduleButton bookingId={nextBooking.id} timezone={timezone} />
                  <OwnerCancelButton bookingId={nextBooking.id} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Views */}
      {activeBookings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No upcoming bookings</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When clients book your services, they&apos;ll appear here in real time.
          </p>
        </div>
      ) : view === "list" ? (
        <BookingListView
          bookings={activeBookings}
          timezone={timezone}
          newBookingIds={newBookingIds}
        />
      ) : view === "grid" ? (
        <BookingGridView
          bookings={activeBookings}
          timezone={timezone}
          newBookingIds={newBookingIds}
        />
      ) : (
        <BookingCalendarView
          bookings={activeBookings}
          timezone={timezone}
          newBookingIds={newBookingIds}
        />
      )}

      {/* New Booking Modal */}
      {showModal && (
        <NewBookingModal
          businessId={businessId}
          timezone={timezone}
          services={services}
          staffMembers={staffMembers}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

// ── List View ──

function BookingListView({
  bookings,
  timezone,
  newBookingIds,
}: {
  bookings: CalendarBooking[];
  timezone: string;
  newBookingIds: Set<string>;
}) {
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <BookingListCard
          key={b.id}
          booking={b}
          timezone={timezone}
          isNew={newBookingIds.has(b.id)}
        />
      ))}
    </div>
  );
}

function BookingListCard({
  booking: b,
  timezone,
  isNew,
}: {
  booking: CalendarBooking;
  timezone: string;
  isNew: boolean;
}) {
  const canManage = b.status === "confirmed";

  return (
    <div
      className={clsx(
        "rounded-xl border bg-card p-4 transition-all duration-500",
        isNew
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2"
          : "border-border",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{b.serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {b.clientName} — {b.staffName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-foreground">
            {formatDate(b.starts_at, timezone)}{" "}
            {formatTime(b.starts_at, timezone)}
          </span>
          <StatusBadge status={b.status} />
          {b.source === "manual" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              manual
            </span>
          )}
          {canManage && (
            <>
              <RescheduleButton bookingId={b.id} timezone={timezone} />
              <OwnerCancelButton bookingId={b.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grid View ──

function BookingGridView({
  bookings,
  timezone,
  newBookingIds,
}: {
  bookings: CalendarBooking[];
  timezone: string;
  newBookingIds: Set<string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((b) => {
        const canManage = b.status === "confirmed";
        const isNew = newBookingIds.has(b.id);

        return (
          <div
            key={b.id}
            className={clsx(
              "flex flex-col rounded-xl border bg-card p-5 transition-all duration-500",
              isNew
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 animate-in fade-in"
                : "border-border",
            )}
          >
            <div className="mb-3 flex items-start justify-between">
              <StatusBadge status={b.status} />
              {b.source === "manual" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  manual
                </span>
              )}
            </div>

            <h3 className="font-semibold text-foreground">{b.serviceName}</h3>

            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{b.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{b.staffName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatDate(b.starts_at, timezone)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatTimeRange(b.starts_at, b.ends_at, timezone)}</span>
              </div>
            </div>

            {canManage && (
              <div className="mt-auto flex items-center gap-2 pt-3">
                <RescheduleButton bookingId={b.id} timezone={timezone} />
                <OwnerCancelButton bookingId={b.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar View ──

function BookingCalendarView({
  bookings,
  timezone,
  newBookingIds,
}: {
  bookings: CalendarBooking[];
  timezone: string;
  newBookingIds: Set<string>;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(b.starts_at));
      const list = map.get(dateKey) ?? [];
      list.push(b);
      map.set(dateKey, list);
    }
    return map;
  }, [bookings, timezone]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) ?? []) : [];

  return (
    <div>
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
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
          const hasNewBooking = dayBookings.some((b) => newBookingIds.has(b.id));

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              className={clsx(
                "border-b border-r border-border p-1.5 text-left transition-colors min-h-[60px] sm:min-h-[80px]",
                isSelected
                  ? "bg-primary/5"
                  : hasNewBooking
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
                        newBookingIds.has(b.id)
                          ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                          : b.status === "confirmed"
                            ? "bg-primary/10 text-primary"
                            : b.status === "completed"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span className="hidden sm:inline">
                        {formatTime(b.starts_at, timezone)}{" "}
                      </span>
                      {b.clientName}
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
                <BookingListCard
                  key={b.id}
                  booking={b}
                  timezone={timezone}
                  isNew={newBookingIds.has(b.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
