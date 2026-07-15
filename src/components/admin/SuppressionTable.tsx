"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface SuppressionRow {
  id: string;
  email: string;
  reason: string;
  created_at: string;
}

const PAGE_SIZE = 20;

const REASON_LABELS: Record<string, string> = {
  unsubscribed: "Unsubscribed",
  bounced: "Bounced",
  complained: "Complained",
  manual: "Manual",
};

export function SuppressionTable({ rows }: { rows: SuppressionRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState(false);

  const filtered = search.trim()
    ? rows.filter((r) => r.email.toLowerCase().includes(search.toLowerCase()))
    : rows;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const handleRemove = async (id: string) => {
    setPending(true);
    try {
      await fetch(`/api/admin/leads/suppression?id=${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleAdd = async (email: string) => {
    setPending(true);
    try {
      await fetch("/api/admin/leads/suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: "manual" }),
      });
      setShowAdd(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/leads"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search suppressed emails..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Reason
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-right font-medium text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No suppressed emails.
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.reason === "bounced"
                          ? "bg-destructive/10 text-destructive"
                          : r.reason === "complained"
                            ? "bg-destructive/10 text-destructive"
                            : r.reason === "unsubscribed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-warning/10 text-warning"
                      }`}
                    >
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(r.id)}
                      disabled={pending}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors disabled:opacity-50"
                      title="Remove from suppression"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {safePage * PAGE_SIZE + 1}&ndash;
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
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

      {/* Add Modal */}
      {showAdd && (
        <AddSuppressionModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          pending={pending}
        />
      )}
    </div>
  );
}

function AddSuppressionModal({
  onClose,
  onAdd,
  pending,
}: {
  onClose: () => void;
  onAdd: (email: string) => void;
  pending: boolean;
}) {
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-heading">
            Add to Suppression
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => email.trim() && onAdd(email.trim())}
            disabled={!email.trim() || pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Adding..." : "Suppress"}
          </button>
        </div>
      </div>
    </div>
  );
}
