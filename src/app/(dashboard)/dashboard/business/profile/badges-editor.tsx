"use client";

import { useState } from "react";
import { BADGES, BADGE_CATEGORIES, MAX_BADGES, type BadgeCategory } from "@/lib/badges";

export function BadgesEditor({
  businessId,
  currentBadges,
}: {
  businessId: string;
  currentBadges: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentBadges));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_BADGES) return prev;
        next.add(id);
      }
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/businesses/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, badges: Array.from(selected) }),
    });

    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save badges");
    }
    setSaving(false);
  }

  const grouped = Object.entries(BADGE_CATEGORIES) as [BadgeCategory, string][];

  return (
    <div className="space-y-6">
      {grouped.map(([category, label]) => {
        const badges = BADGES.filter((b) => b.category === category);
        return (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => {
                const isSelected = selected.has(badge.id);
                const isDisabled = !isSelected && selected.size >= MAX_BADGES;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggle(badge.id)}
                    disabled={isDisabled}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : isDisabled
                          ? "border-border bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span>{badge.emoji}</span>
                    {badge.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save badges"}
        </button>
        <span className="text-sm text-muted-foreground">
          {selected.size}/{MAX_BADGES} selected
        </span>
        {saved && (
          <span className="text-sm text-success">Saved!</span>
        )}
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
