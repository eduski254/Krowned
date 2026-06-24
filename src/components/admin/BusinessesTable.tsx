"use client";

import Link from "next/link";
import { DataTable, type Column } from "./DataTable";

interface Business {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  verification_status: string;
  subscription_status: string | null;
  owner: { full_name: string } | null;
}

const columns: Column<Business>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    searchable: true,
    value: (r) => r.name,
    render: (r) => (
      <Link href={`/b/${r.slug}`} className="font-medium text-primary hover:underline">
        {r.name}
      </Link>
    ),
  },
  {
    key: "owner",
    header: "Owner",
    sortable: true,
    searchable: true,
    value: (r) => r.owner?.full_name ?? "",
    render: (r) => (
      <span className="text-muted-foreground">{r.owner?.full_name ?? "—"}</span>
    ),
  },
  {
    key: "location",
    header: "Location",
    sortable: true,
    searchable: true,
    value: (r) => [r.city, r.country].filter(Boolean).join(", "),
    render: (r) => (
      <span className="text-muted-foreground">
        {[r.city, r.country].filter(Boolean).join(", ") || "—"}
      </span>
    ),
  },
  {
    key: "verification_status",
    header: "Status",
    sortable: true,
    value: (r) => r.verification_status,
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.verification_status === "verified"
            ? "bg-success/10 text-success"
            : r.verification_status === "suspended"
              ? "bg-destructive/10 text-destructive"
              : "bg-warning/10 text-warning"
        }`}
      >
        {r.verification_status}
      </span>
    ),
  },
  {
    key: "subscription_status",
    header: "Plan",
    sortable: true,
    value: (r) => r.subscription_status ?? "free",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.subscription_status === "active" || r.subscription_status === "trialing"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {r.subscription_status ?? "free"}
      </span>
    ),
  },
];

export function BusinessesTable({ rows }: { rows: Business[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      exportFilename="businesses"
    />
  );
}
