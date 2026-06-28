"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/spinner";

interface EmailPref {
  eventType: string;
  label: string;
  description: string;
  essential: boolean;
  enabled: boolean;
}

export function EmailPreferences({
  preferences,
}: {
  preferences: EmailPref[];
}) {
  const [prefs, setPrefs] = useState(preferences);
  const [isPending, startTransition] = useTransition();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const toggle = (eventType: string, newValue: boolean) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.eventType === eventType ? { ...p, enabled: newValue } : p,
      ),
    );
    setSavingKey(eventType);
    startTransition(async () => {
      const res = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, email: newValue }),
      });
      if (!res.ok) {
        // Revert on failure
        setPrefs((prev) =>
          prev.map((p) =>
            p.eventType === eventType ? { ...p, enabled: !newValue } : p,
          ),
        );
      }
      setSavingKey(null);
    });
  };

  return (
    <div className="space-y-3">
      {prefs.map((p) => (
        <label
          key={p.eventType}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <span className="text-sm font-medium text-foreground">
              {p.label}
            </span>
            <p className="text-xs text-muted-foreground">{p.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPending && savingKey === p.eventType && (
              <Spinner className="h-3 w-3 text-muted-foreground" />
            )}
            <input
              type="checkbox"
              checked={p.enabled}
              disabled={p.essential}
              onChange={(e) => toggle(p.eventType, e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:opacity-50"
            />
          </div>
        </label>
      ))}
      <p className="text-xs text-muted-foreground">
        Essential emails (confirmations, cancellations) cannot be turned off.
      </p>
    </div>
  );
}
