"use client";

import { useState, useTransition } from "react";
import { saveBusinessHours } from "./actions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayHours = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export function HoursEditor({
  businessId,
  initialHours,
}: {
  businessId: string;
  initialHours: { day_of_week: number; open_time: string | null; close_time: string | null }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [days, setDays] = useState<DayHours[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const existing = initialHours.find((h) => h.day_of_week === i);
      return {
        day_of_week: i,
        open_time: existing?.open_time?.slice(0, 5) ?? "09:00",
        close_time: existing?.close_time?.slice(0, 5) ?? "17:00",
        is_closed: !existing,
      };
    }),
  );

  const updateDay = (idx: number, field: keyof DayHours, value: string | boolean) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    );
  };

  const handleSave = () => {
    // Client-side validation
    for (const day of days) {
      if (!day.is_closed && day.close_time <= day.open_time) {
        setMessage({
          type: "error",
          text: `${DAY_NAMES[day.day_of_week]}: closing time must be after opening time.`,
        });
        return;
      }
    }

    setMessage(null);
    const fd = new FormData();
    fd.set("businessId", businessId);
    fd.set("hours", JSON.stringify(days));

    startTransition(async () => {
      const result = await saveBusinessHours(fd);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Business hours saved." });
      }
    });
  };

  return (
    <div className="space-y-4">
      {days.map((day, idx) => (
        <div
          key={day.day_of_week}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="w-28 shrink-0">
            <span className="text-sm font-medium text-foreground">
              {DAY_NAMES[day.day_of_week]}
            </span>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={day.is_closed}
              onChange={(e) => updateDay(idx, "is_closed", e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">Closed</span>
          </label>

          {!day.is_closed && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={day.open_time}
                onChange={(e) => updateDay(idx, "open_time", e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="time"
                value={day.close_time}
                onChange={(e) => updateDay(idx, "close_time", e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>
      ))}

      {message && (
        <p
          className={`text-sm ${
            message.type === "error" ? "text-destructive" : "text-success"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Hours"}
      </button>
    </div>
  );
}
