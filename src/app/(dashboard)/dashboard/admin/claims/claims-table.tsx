"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

type Claim = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  proof_notes: string | null;
  status: string;
  created_at: string;
  business_id: string;
  claimant_id: string;
  businesses: { name: string; slug: string } | { name: string; slug: string }[] | null;
  profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
};

export function ClaimsTable({ claims: initial }: { claims: Claim[] }) {
  const [claims, setClaims] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleReview(claimId: string, action: "approved" | "rejected") {
    setLoading(claimId);

    const res = await fetch("/api/businesses/claim/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, action }),
    });

    if (res.ok) {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: action } : c)),
      );
    }

    setLoading(null);
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No claims yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => {
        const rawBiz = claim.businesses;
        const biz = Array.isArray(rawBiz) ? rawBiz[0] : rawBiz;
        return (
          <div
            key={claim.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {claim.full_name}
                  </h3>
                  {statusBadge(claim.status)}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {claim.email}
                  {claim.phone && ` · ${claim.phone}`}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Claiming:{" "}
                  <a
                    href={`/b/${biz?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {biz?.name ?? "Unknown"}{" "}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                {claim.proof_notes && (
                  <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    <p className="text-xs font-medium text-foreground mb-1">
                      Proof/Notes:
                    </p>
                    {claim.proof_notes}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(claim.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {claim.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(claim.id, "approved")}
                    disabled={loading === claim.id}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(claim.id, "rejected")}
                    disabled={loading === claim.id}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
