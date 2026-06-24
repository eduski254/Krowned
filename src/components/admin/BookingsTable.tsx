"use client";

import { DataTable, type Column } from "./DataTable";

interface Booking {
  id: string;
  starts_at: string;
  status: string;
  source: string;
  service_amount: number | null;
  currency: string | null;
  services: { name: string } | null;
  businesses: { name: string } | null;
  clients: { full_name: string } | null;
}

const columns: Column<Booking>[] = [
  {
    key: "service",
    header: "Service",
    sortable: true,
    searchable: true,
    value: (r) => r.services?.name ?? "",
    render: (r) => (
      <span className="text-foreground">{r.services?.name ?? "—"}</span>
    ),
  },
  {
    key: "business",
    header: "Business",
    sortable: true,
    searchable: true,
    value: (r) => r.businesses?.name ?? "",
    render: (r) => (
      <span className="text-muted-foreground">{r.businesses?.name ?? "—"}</span>
    ),
  },
  {
    key: "client",
    header: "Client",
    sortable: true,
    searchable: true,
    value: (r) => r.clients?.full_name ?? "",
    render: (r) => (
      <span className="text-muted-foreground">{r.clients?.full_name ?? "—"}</span>
    ),
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    value: (r) => r.starts_at,
    render: (r) => (
      <span className="text-muted-foreground">
        {new Date(r.starts_at).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    value: (r) => r.status,
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.status === "completed"
            ? "bg-success/10 text-success"
            : r.status === "cancelled"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
        }`}
      >
        {r.status}
      </span>
    ),
  },
  {
    key: "source",
    header: "Source",
    sortable: true,
    value: (r) => r.source,
    render: (r) => (
      <span className="text-xs text-muted-foreground">{r.source}</span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    align: "right",
    value: (r) =>
      r.service_amount != null
        ? `${(r.service_amount / 100).toFixed(2)} ${r.currency?.toUpperCase() ?? ""}`
        : "",
    render: (r) => (
      <span className="font-medium text-foreground">
        {r.service_amount != null
          ? `${(r.service_amount / 100).toFixed(2)} ${r.currency?.toUpperCase() ?? ""}`
          : "—"}
      </span>
    ),
  },
];

export function BookingsTable({ rows }: { rows: Booking[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      exportFilename="bookings"
    />
  );
}
