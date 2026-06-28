"use client";

import Link from "next/link";

interface Props {
  current: string;
  counts: Record<string, number>;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

export function AdminTicketFilters({ current, counts }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {FILTERS.map((f) => {
        const isActive = current === f.key;
        const count = counts[f.key] ?? 0;
        return (
          <Link
            key={f.key}
            href={`/dashboard/admin/support?status=${f.key}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              isActive ? "bg-primary-foreground/20" : "bg-background"
            }`}>
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
