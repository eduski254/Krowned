"use client";

import { DataTable, type Column } from "./DataTable";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  platform_role: string;
  created_at: string;
}

const columns: Column<Profile>[] = [
  {
    key: "full_name",
    header: "Name",
    sortable: true,
    searchable: true,
    value: (r) => r.full_name ?? "",
    render: (r) => (
      <span className="font-medium text-foreground">{r.full_name || "—"}</span>
    ),
  },
  {
    key: "country",
    header: "Country",
    sortable: true,
    searchable: true,
    value: (r) => r.country ?? "",
    render: (r) => (
      <span className="text-muted-foreground">{r.country || "—"}</span>
    ),
  },
  {
    key: "platform_role",
    header: "Role",
    sortable: true,
    value: (r) => r.platform_role,
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.platform_role === "super_admin"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {r.platform_role}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Joined",
    sortable: true,
    value: (r) => r.created_at,
    render: (r) => (
      <span className="text-muted-foreground">
        {new Date(r.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export function UsersTable({ rows }: { rows: Profile[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      exportFilename="users"
    />
  );
}
