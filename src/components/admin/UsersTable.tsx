"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  MoreHorizontal,
  Ban,
  ShieldCheck,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  FileText,
  Inbox,
  UserCheck,
} from "lucide-react";
import { startImpersonation } from "@/lib/impersonate";

export interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  platform_role: string;
  created_at: string;
  is_banned: boolean;
  derived_role: "super_admin" | "business_owner" | "staff" | "client";
  business_name: string | null;
}

type RoleFilter = "all" | "super_admin" | "business_owner" | "staff" | "client";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  business_owner: "Business Owner",
  staff: "Staff",
  client: "Client",
};

const PAGE_SIZE = 20;

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filter
  const filtered = useMemo(() => {
    let list = rows;
    if (roleFilter !== "all") {
      list = list.filter((r) => r.derived_role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.full_name?.toLowerCase().includes(q)) ||
          (r.email?.toLowerCase().includes(q)) ||
          (r.phone?.toLowerCase().includes(q)) ||
          (r.business_name?.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [rows, search, roleFilter]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getValue(a, sortKey).toLowerCase();
      const bv = getValue(b, sortKey).toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const handleViewAs = (userId: string) => {
    startTransition(async () => {
      const result = await startImpersonation(userId);
      if (result.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  const handleAction = async (userId: string, action: string) => {
    setActionPending(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActionPending(false);
      setMenuOpen(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setActionPending(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setActionPending(false);
      setConfirmDelete(null);
      setMenuOpen(null);
    }
  };

  // Role filter counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    for (const r of rows) {
      counts[r.derived_role] = (counts[r.derived_role] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Country", "Business", "Joined"];
    const csvRows = sorted.map((r) => [
      r.full_name ?? "",
      r.email ?? "",
      r.phone ?? "",
      ROLE_LABELS[r.derived_role] ?? r.derived_role,
      r.country ?? "",
      r.business_name ?? "",
      new Date(r.created_at).toLocaleDateString(),
    ].map((v) => `"${v.replace(/"/g, '""')}"`));
    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Users", 14, 18);
    doc.setFontSize(9);
    doc.text(`${sorted.length} records — exported ${new Date().toLocaleDateString()}`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [["Name", "Email", "Role", "Country", "Business", "Joined"]],
      body: sorted.map((r) => [
        r.full_name ?? "",
        r.email ?? "",
        ROLE_LABELS[r.derived_role] ?? r.derived_role,
        r.country ?? "",
        r.business_name ?? "",
        new Date(r.created_at).toLocaleDateString(),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [86, 4, 173] },
    });
    doc.save("users.pdf");
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="text-muted-foreground">
      {sortKey === col ? (
        sortDir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "business_owner", "staff", "client", "super_admin"] as RoleFilter[]).map((rf) => (
          <button
            key={rf}
            onClick={() => { setRoleFilter(rf); setPage(0); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === rf
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {rf === "all" ? "All" : ROLE_LABELS[rf]} ({roleCounts[rf] ?? 0})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, email, phone, business..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th label="Name" col="full_name" sortable toggleSort={toggleSort}>
                <SortIcon col="full_name" />
              </Th>
              <Th label="Email" col="email" sortable toggleSort={toggleSort}>
                <SortIcon col="email" />
              </Th>
              <th className="hidden px-4 py-3 text-left font-medium text-foreground lg:table-cell">
                Phone
              </th>
              <Th label="Role" col="derived_role" sortable toggleSort={toggleSort}>
                <SortIcon col="derived_role" />
              </Th>
              <th className="hidden px-4 py-3 text-left font-medium text-foreground md:table-cell">
                Business
              </th>
              <Th label="Joined" col="created_at" sortable toggleSort={toggleSort}>
                <SortIcon col="created_at" />
              </Th>
              <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rows.length === 0 ? "No users yet." : "No results match your search."}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {r.full_name || "\u2014"}
                      </span>
                      {r.is_banned && (
                        <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.email || "\u2014"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {r.phone || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={r.derived_role} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {r.business_name || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewAs(r.id)}
                        disabled={isPending}
                        title="View as this user"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen === r.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => { setMenuOpen(null); setConfirmDelete(null); }}
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                              {!r.is_banned ? (
                                <button
                                  onClick={() => handleAction(r.id, "suspend")}
                                  disabled={actionPending}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <Ban className="h-4 w-4 text-warning" />
                                  Suspend User
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(r.id, "unsuspend")}
                                  disabled={actionPending}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <UserCheck className="h-4 w-4 text-success" />
                                  Unsuspend User
                                </button>
                              )}
                              {r.platform_role !== "super_admin" ? (
                                <button
                                  onClick={() => handleAction(r.id, "make_admin")}
                                  disabled={actionPending}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <ShieldCheck className="h-4 w-4 text-primary" />
                                  Make Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(r.id, "remove_admin")}
                                  disabled={actionPending}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                                  Remove Admin
                                </button>
                              )}
                              <div className="my-1 border-t border-border" />
                              {confirmDelete === r.id ? (
                                <div className="space-y-1 p-2">
                                  <p className="text-xs text-destructive font-medium">
                                    Permanently delete this user?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDelete(r.id)}
                                      disabled={actionPending}
                                      className="flex-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                    >
                                      {actionPending ? "Deleting..." : "Yes, delete"}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(null)}
                                      className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(r.id)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete User
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {safePage * PAGE_SIZE + 1}&ndash;
            {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            {filtered.length !== rows.length && ` (filtered from ${rows.length})`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-foreground">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary",
    business_owner: "bg-info/10 text-info",
    staff: "bg-warning/10 text-warning",
    client: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[role] ?? styles.client}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function Th({
  label,
  col,
  sortable,
  toggleSort,
  children,
}: {
  label: string;
  col: string;
  sortable?: boolean;
  toggleSort: (key: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <th
      className={`px-4 py-3 text-left font-medium text-foreground ${sortable ? "cursor-pointer select-none hover:bg-muted/80" : ""}`}
      onClick={sortable ? () => toggleSort(col) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {children}
      </span>
    </th>
  );
}

function getValue(row: UserRow, key: string): string {
  switch (key) {
    case "full_name": return row.full_name ?? "";
    case "email": return row.email ?? "";
    case "derived_role": return row.derived_role;
    case "created_at": return row.created_at;
    default: return "";
  }
}
