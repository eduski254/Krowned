"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Inbox,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

export interface Column<T> {
  /** Unique key for this column */
  key: string;
  /** Header label */
  header: string;
  /** Enable sorting on this column (default false) */
  sortable?: boolean;
  /** Include this column in text search (default false) */
  searchable?: boolean;
  /** How to render the cell. Receives the row. Falls back to String(row[key]). */
  render?: (row: T) => ReactNode;
  /** Extract a plain string for search/sort/export. Falls back to String(row[key]). */
  value?: (row: T) => string;
  /** Text alignment: "left" (default) | "right" */
  align?: "left" | "right";
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T) => string;
  /** Rows per page (default 20) */
  pageSize?: number;
  /** Show loading state */
  loading?: boolean;
  /** Label for the table, used in export filenames */
  exportFilename?: string;
}

// ── Component ──────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 20,
  loading = false,
  exportFilename = "export",
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  // Search columns
  const searchCols = useMemo(
    () => columns.filter((c) => c.searchable),
    [columns],
  );

  // Get string value from a row for a column
  const getStringValue = useCallback(
    (row: T, col: Column<T>): string => {
      if (col.value) return col.value(row);
      const raw = (row as Record<string, unknown>)[col.key];
      return raw == null ? "" : String(raw);
    },
    [],
  );

  // Filtered rows
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      searchCols.some((col) => getStringValue(row, col).toLowerCase().includes(q)),
    );
  }, [rows, search, searchCols, getStringValue]);

  // Sorted rows
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getStringValue(a, col).toLowerCase();
      const bv = getStringValue(b, col).toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns, getStringValue]);

  // Paginated rows
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Reset page on search
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  // Toggle sort
  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  // ── Export CSV ─────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = columns.map((c) => c.header);
    const csvRows = sorted.map((row) =>
      columns.map((col) => {
        const val = getStringValue(row, col);
        // Escape double quotes
        return `"${val.replace(/"/g, '""')}"`;
      }),
    );
    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    downloadBlob(csv, `${exportFilename}.csv`, "text/csv");
  };

  // ── Export PDF ─────────────────────────────────────────────────

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: sorted.length > 0 && columns.length > 5 ? "landscape" : "portrait" });

    doc.setFontSize(14);
    doc.text(exportFilename, 14, 18);
    doc.setFontSize(9);
    doc.text(`${sorted.length} records — exported ${new Date().toLocaleDateString()}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [columns.map((c) => c.header)],
      body: sorted.map((row) => columns.map((col) => getStringValue(row, col))),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [200, 107, 60] }, // brand primary #C86B3C
    });

    doc.save(`${exportFilename}.pdf`);
  };

  // ── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Export buttons */}
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
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-foreground ${
                    col.align === "right" ? "text-right" : "text-left"
                  } ${col.sortable ? "cursor-pointer select-none hover:bg-muted/80" : ""}`}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-muted-foreground">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rows.length === 0 ? "No data yet." : "No results match your search."}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-muted/50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : getStringValue(row, col) || "—"}
                    </td>
                  ))}
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
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)}{" "}
            of {sorted.length}
            {filtered.length !== rows.length && ` (filtered from ${rows.length})`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-foreground font-medium">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
