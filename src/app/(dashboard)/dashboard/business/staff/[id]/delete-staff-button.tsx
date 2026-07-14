"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteStaff } from "../actions";

export function DeleteStaffButton({
  staffId,
  hasBookings,
}: {
  staffId: string;
  hasBookings: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const fd = new FormData();
    fd.set("staff_id", staffId);
    const result = await deleteStaff(fd);
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
      setConfirming(false);
    }
    // On success, the server action redirects
  }

  if (confirming) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <p className="text-sm font-medium text-destructive">
          Are you sure? This will permanently delete this staff member
          {hasBookings ? "" : " and all their schedules"}.
          {hasBookings && (
            <span className="block mt-1 text-muted-foreground font-normal">
              This staff member has booking history. You can only deactivate them.
            </span>
          )}
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex items-center gap-3">
          {!hasBookings && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
          )}
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Delete staff member
    </button>
  );
}
