"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  FileText,
  Inbox,
  Plus,
  Upload,
  Eye,
  Trash2,
  Pause,
  Play,
  Mail,
  X,
  Settings2,
  ShieldBan,
} from "lucide-react";
import Link from "next/link";

export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  business_name: string | null;
  phone: string | null;
  source: string | null;
  tags: string[];
  city: string | null;
  stage: string;
  nurture_status: string;
  nurture_step: number;
  nurture_next_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

interface CrmSettings {
  id: string;
  nurture_paused: boolean;
  daily_cap: number;
  dry_run: boolean;
  warmup_start_date: string | null;
}

type StageFilter = "all" | "new" | "contacted" | "qualified" | "converted";
type StatusFilter = "all" | "active" | "unsubscribed" | "completed" | "bounced" | "paused" | "converted";

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  unsubscribed: "Unsubscribed",
  completed: "Completed",
  bounced: "Bounced",
  paused: "Paused",
  converted: "Converted",
};

const PAGE_SIZE = 20;

export function LeadsTable({
  rows,
  settings,
}: {
  rows: LeadRow[];
  settings: CrmSettings | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filter
  const filtered = useMemo(() => {
    let list = rows;
    if (stageFilter !== "all") {
      list = list.filter((r) => r.stage === stageFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.nurture_status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.business_name?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, search, stageFilter, statusFilter]);

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

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    for (const r of rows) counts[r.stage] = (counts[r.stage] ?? 0) + 1;
    return counts;
  }, [rows]);

  const handleAction = useCallback(
    async (id: string, action: Record<string, unknown>) => {
      setActionPending(true);
      try {
        await fetch("/api/admin/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...action }),
        });
        router.refresh();
      } finally {
        setActionPending(false);
        setMenuOpen(null);
      }
    },
    [router],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setActionPending(true);
      try {
        await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
        router.refresh();
      } finally {
        setActionPending(false);
        setConfirmDelete(null);
        setMenuOpen(null);
      }
    },
    [router],
  );

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("file", file);
      setActionPending(true);
      try {
        const res = await fetch("/api/admin/leads/import", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        setImportResult(data);
        router.refresh();
      } finally {
        setActionPending(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [router],
  );

  const exportCSV = () => {
    const headers = [
      "Name","Email","Business","Phone","Source","Tags","City","Stage","Status","Step","Next Send","Created",
    ];
    const csvRows = sorted.map((r) =>
      [
        r.name ?? "",
        r.email ?? "",
        r.business_name ?? "",
        r.phone ?? "",
        r.source ?? "",
        (r.tags ?? []).join(";"),
        r.city ?? "",
        r.stage,
        r.nurture_status,
        `${r.nurture_step}/10`,
        r.nurture_next_at ? new Date(r.nurture_next_at).toLocaleDateString() : "",
        new Date(r.created_at).toLocaleDateString(),
      ].map((v) => `"${v.replace(/"/g, '""')}"`),
    );
    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Leads", 14, 18);
    doc.setFontSize(9);
    doc.text(
      `${sorted.length} records — exported ${new Date().toLocaleDateString()}`,
      14,
      24,
    );
    autoTable(doc, {
      startY: 30,
      head: [["Name", "Email", "Business", "Source", "Stage", "Status", "Step"]],
      body: sorted.map((r) => [
        r.name ?? "",
        r.email ?? "",
        r.business_name ?? "",
        r.source ?? "",
        r.stage,
        r.nurture_status,
        `${r.nurture_step}/10`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [86, 4, 173] },
    });
    doc.save("leads.pdf");
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
      {/* Import result banner */}
      {importResult && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <div>
            <strong>Import complete:</strong> {String(importResult.imported)} imported,{" "}
            {String(importResult.skipped_existing)} existing,{" "}
            {String(importResult.skipped_suppressed)} suppressed
            {(importResult.errors as string[])?.length
              ? `, ${(importResult.errors as string[]).length} errors`
              : ""}
          </div>
          <button onClick={() => setImportResult(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stage tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "qualified", "converted"] as StageFilter[]).map(
          (sf) => (
            <button
              key={sf}
              onClick={() => {
                setStageFilter(sf);
                setPage(0);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                stageFilter === sf
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {sf === "all" ? "All" : STAGE_LABELS[sf]} ({stageCounts[sf] ?? 0})
            </button>
          ),
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search name, email, business..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(0);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
          </label>
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
          <Link
            href="/dashboard/admin/leads/suppression"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ShieldBan className="h-3.5 w-3.5" />
            Suppression
          </Link>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th label="Name" col="name" sortable toggleSort={toggleSort}>
                <SortIcon col="name" />
              </Th>
              <Th label="Email" col="email" sortable toggleSort={toggleSort}>
                <SortIcon col="email" />
              </Th>
              <th className="hidden px-4 py-3 text-left font-medium text-foreground md:table-cell">
                Business
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Source</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Stage</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Nurture</th>
              <Th label="Next Send" col="nurture_next_at" sortable toggleSort={toggleSort}>
                <SortIcon col="nurture_next_at" />
              </Th>
              <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rows.length === 0
                      ? "No leads yet. Add one manually or import a CSV."
                      : "No results match your filters."}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.name || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.email || "\u2014"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {r.business_name || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {r.source || "\u2014"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={r.stage} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <NurtureStatusDot status={r.nurture_status} />
                      <span className="text-xs text-muted-foreground">
                        {r.nurture_step}/10
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.nurture_next_at
                      ? new Date(r.nurture_next_at).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/admin/leads/${r.id}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === r.id ? null : r.id)
                          }
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen === r.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => {
                                setMenuOpen(null);
                                setConfirmDelete(null);
                              }}
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                              {r.nurture_status === "active" ? (
                                <button
                                  onClick={() =>
                                    handleAction(r.id, {
                                      nurture_status: "paused",
                                    })
                                  }
                                  disabled={actionPending}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <Pause className="h-4 w-4 text-warning" />
                                  Pause Nurture
                                </button>
                              ) : r.nurture_status === "paused" ? (
                                <button
                                  onClick={() =>
                                    handleAction(r.id, {
                                      nurture_status: "active",
                                    })
                                  }
                                  disabled={actionPending}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <Play className="h-4 w-4 text-success" />
                                  Resume Nurture
                                </button>
                              ) : null}
                              <button
                                onClick={() =>
                                  handleAction(r.id, {
                                    nurture_status: "unsubscribed",
                                  })
                                }
                                disabled={actionPending}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                              >
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                Unsubscribe
                              </button>
                              <div className="my-1 border-t border-border" />
                              {confirmDelete === r.id ? (
                                <div className="space-y-1 p-2">
                                  <p className="text-xs font-medium text-destructive">
                                    Delete this lead?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDelete(r.id)}
                                      disabled={actionPending}
                                      className="flex-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                    >
                                      {actionPending ? "..." : "Delete"}
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
                                  Delete Lead
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
            {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of{" "}
            {sorted.length}
            {filtered.length !== rows.length &&
              ` (filtered from ${rows.length})`}
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

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onDone={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && settings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onDone={() => {
            setShowSettingsModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    new: "bg-info/10 text-info",
    contacted: "bg-warning/10 text-warning",
    qualified: "bg-primary/10 text-primary",
    converted: "bg-success/10 text-success",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[stage] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}

function NurtureStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-success",
    paused: "bg-warning",
    completed: "bg-primary",
    unsubscribed: "bg-muted-foreground",
    bounced: "bg-destructive",
    converted: "bg-success",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        colors[status] ?? "bg-muted-foreground"
      }`}
      title={STATUS_LABELS[status] ?? status}
    />
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
      className={`px-4 py-3 text-left font-medium text-foreground ${
        sortable ? "cursor-pointer select-none hover:bg-muted/80" : ""
      }`}
      onClick={sortable ? () => toggleSort(col) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {children}
      </span>
    </th>
  );
}

function getValue(row: LeadRow, key: string): string {
  switch (key) {
    case "name":
      return row.name ?? "";
    case "email":
      return row.email ?? "";
    case "nurture_next_at":
      return row.nurture_next_at ?? "";
    default:
      return "";
  }
}

// ── Add Lead Modal ──────────────────────────────────────────────────

function AddLeadModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
      business_name: fd.get("business_name"),
      phone: fd.get("phone"),
      source: fd.get("source") || "manual",
      tags: (fd.get("tags") as string)
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) ?? [],
      city: fd.get("city"),
      notes: fd.get("notes"),
    };

    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add lead");
        return;
      }
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-heading">
            Add Lead
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Name"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="email"
              type="email"
              placeholder="Email *"
              required
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="business_name"
              placeholder="Business name"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="phone"
              placeholder="Phone"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              name="source"
              defaultValue="manual"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="manual">Manual</option>
              <option value="google">Google</option>
              <option value="yelp">Yelp</option>
              <option value="import">Import</option>
            </select>
            <input
              name="city"
              placeholder="City"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <input
            name="tags"
            placeholder="Tags (comma-separated)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Settings Modal ──────────────────────────────────────────────────

function SettingsModal({
  settings,
  onClose,
  onDone,
}: {
  settings: CrmSettings;
  onClose: () => void;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [nurturePaused, setNurturePaused] = useState(settings.nurture_paused);
  const [dryRun, setDryRun] = useState(settings.dry_run);
  const [dailyCap, setDailyCap] = useState(settings.daily_cap);
  const [warmupDate, setWarmupDate] = useState(settings.warmup_start_date ?? "");

  const handleSave = async () => {
    setPending(true);
    try {
      await fetch("/api/admin/leads/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nurture_paused: nurturePaused,
          dry_run: dryRun,
          daily_cap: dailyCap,
          warmup_start_date: warmupDate || null,
        }),
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-heading">
            Nurture Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Pause nurture (kill switch)
              </p>
              <p className="text-xs text-muted-foreground">
                Stops all nurture sends globally
              </p>
            </div>
            <ToggleSwitch checked={nurturePaused} onChange={setNurturePaused} />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dry run</p>
              <p className="text-xs text-muted-foreground">
                Logs sends without calling Resend
              </p>
            </div>
            <ToggleSwitch checked={dryRun} onChange={setDryRun} />
          </label>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Daily cap
            </label>
            <input
              type="number"
              value={dailyCap}
              min={1}
              max={1000}
              onChange={(e) => setDailyCap(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Max nurture emails per day (Resend free tier: reserve 30 for transactional)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Warm-up start date
            </label>
            <input
              type="date"
              value={warmupDate}
              onChange={(e) => setWarmupDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Ramps sends 10→20→40→70 over ~2 weeks. Leave empty to disable.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
