"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";

const TIME_LABELS: Record<TimeOfDay, string> = {
  anytime: "Anytime",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const TIME_SUBLABELS: Record<TimeOfDay, string> = {
  anytime: "",
  morning: "6am – 12pm",
  afternoon: "12pm – 5pm",
  evening: "5pm – 9pm",
};

export function WhenDropdown({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onClear,
}: {
  selectedDate: string | null; // YYYY-MM-DD
  selectedTime: TimeOfDay;
  onDateChange: (date: string | null) => void;
  onTimeChange: (time: TimeOfDay) => void;
  onClear: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{ date: Date; inMonth: boolean }> = [];

    // Fill leading days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      days.push({ date: d, inMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
    }

    // Fill trailing to complete the grid (up to 42 cells = 6 rows)
    while (days.length < 42) {
      const last = days[days.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      days.push({ date: next, inMonth: false });
    }

    return days;
  }, [viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const hasSelection = selectedDate || selectedTime !== "anytime";

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 w-[300px] overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:left-auto sm:right-0">
      {/* Calendar */}
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={prevMonth}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            {monthLabel}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={nextMonth}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-px">
          {calDays.map(({ date, inMonth }, i) => {
            const ds = formatDateStr(date);
            const isPast = date < today;
            const isSelected = ds === selectedDate;
            const isToday = ds === formatDateStr(today);

            return (
              <button
                key={i}
                type="button"
                disabled={isPast || !inMonth}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onDateChange(isSelected ? null : ds)}
                className={`relative rounded-md py-1.5 text-xs transition-all ${
                  !inMonth || isPast
                    ? "text-muted-foreground/30 cursor-default"
                    : isSelected
                      ? "bg-primary font-bold text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                } ${isToday && !isSelected ? "font-bold text-primary" : ""}`}
              >
                {date.getDate()}
                {isToday && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time of day */}
      <div className="border-t border-border px-3 py-2.5">
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Time of day
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(["anytime", "morning", "afternoon", "evening"] as TimeOfDay[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onTimeChange(t)}
                className={`rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-all ${
                  selectedTime === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <div>{TIME_LABELS[t]}</div>
                {TIME_SUBLABELS[t] && (
                  <div
                    className={`mt-0.5 text-[9px] ${
                      selectedTime === t
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {TIME_SUBLABELS[t]}
                  </div>
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Clear */}
      {hasSelection && (
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <X className="h-3 w-3" />
            Clear date & time
          </button>
        </div>
      )}
    </div>
  );
}

/** Format a selected date for display in the filter button */
export function formatWhenLabel(
  date: string | null,
  time: TimeOfDay,
): string | null {
  if (!date && time === "anytime") return null;

  const parts: string[] = [];
  if (date) {
    const d = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.getTime() === today.getTime()) {
      parts.push("Today");
    } else if (d.getTime() === tomorrow.getTime()) {
      parts.push("Tomorrow");
    } else {
      parts.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }
  }
  if (time !== "anytime") {
    parts.push(TIME_LABELS[time]);
  }
  return parts.join(", ");
}

/** Check if a business is open at the given date + time-of-day */
export function isOpenAt(
  hours: Array<{ day_of_week: number; open_time: string; close_time: string }>,
  date: string | null,
  time: TimeOfDay,
): boolean {
  if (!date && time === "anytime") return true;
  if (hours.length === 0) return false;

  // Get day of week from date (0=Sun)
  let dayOfWeek: number | null = null;
  if (date) {
    const d = new Date(date + "T00:00:00");
    dayOfWeek = d.getDay();
  }

  // Find matching hours
  let candidates = hours;
  if (dayOfWeek !== null) {
    candidates = hours.filter((h) => h.day_of_week === dayOfWeek);
    if (candidates.length === 0) return false; // closed that day
  }

  if (time === "anytime") return candidates.length > 0;

  // Time ranges
  const ranges: Record<string, [number, number]> = {
    morning: [6, 12],
    afternoon: [12, 17],
    evening: [17, 21],
  };
  const [start, end] = ranges[time];

  // Check if any candidate hours overlap with the time range
  return candidates.some((h) => {
    const openHour = parseTimeHour(h.open_time);
    const closeHour = parseTimeHour(h.close_time);
    // Overlap check: business is open during some part of the time range
    return openHour < end && closeHour > start;
  });
}

function parseTimeHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + (m ?? 0) / 60;
}
