"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, CheckCircle, XCircle, Ban } from "lucide-react";
import { DataTable, type Column } from "./DataTable";
import { startImpersonation } from "@/lib/impersonate";

interface Business {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  verification_status: string;
  subscription_status: string | null;
  is_published: boolean;
  owner_id: string;
  owner: { full_name: string } | null;
}

export function BusinessesTable({ rows }: { rows: Business[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const handleViewAs = (ownerId: string) => {
    startTransition(async () => {
      const result = await startImpersonation(ownerId);
      if (result.ok) {
        router.push("/dashboard/business");
        router.refresh();
      }
    });
  };

  const handleVerification = async (
    businessId: string,
    status: "verified" | "suspended" | "rejected",
  ) => {
    setActionPending(true);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, verification_status: status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActionPending(false);
      setMenuOpen(null);
    }
  };

  const columns: Column<Business>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      searchable: true,
      value: (r) => r.name,
      render: (r) => (
        <Link
          href={`/b/${r.slug}`}
          className="font-medium text-primary hover:underline"
        >
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
        <span className="text-muted-foreground">
          {r.owner?.full_name ?? "\u2014"}
        </span>
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
          {[r.city, r.country].filter(Boolean).join(", ") || "\u2014"}
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
            r.subscription_status === "active" ||
            r.subscription_status === "trialing"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {r.subscription_status ?? "free"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleViewAs(r.owner_id)}
            disabled={isPending}
            title="View as owner"
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
                  onClick={() => setMenuOpen(null)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
                  {r.verification_status !== "verified" && (
                    <button
                      onClick={() => handleVerification(r.id, "verified")}
                      disabled={actionPending}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4 text-success" />
                      Verify
                    </button>
                  )}
                  {r.verification_status !== "suspended" && (
                    <button
                      onClick={() => handleVerification(r.id, "suspended")}
                      disabled={actionPending}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Ban className="h-4 w-4 text-warning" />
                      Suspend
                    </button>
                  )}
                  {r.verification_status !== "rejected" && (
                    <button
                      onClick={() => handleVerification(r.id, "rejected")}
                      disabled={actionPending}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      exportFilename="businesses"
    />
  );
}
