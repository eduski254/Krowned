"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { deleteAccount } from "@/lib/account/delete-account";
import { useRouter } from "next/navigation";

export function DeleteAccountSection() {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmText);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/account-deleted");
      }
    });
  }

  return (
    <>
      <div className="mt-10 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h3 className="text-base font-semibold text-destructive">
              Danger Zone
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action cannot be undone after the 14-day grace period.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => {
                setShowModal(false);
                setConfirmText("");
                setError(null);
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-lg font-bold">Delete Account</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>This will permanently delete your account. Here's what happens:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>All your businesses will be unpublished</li>
                <li>Active subscriptions will be cancelled immediately</li>
                <li>Your profile data will be anonymized</li>
                <li>Staff records will be deactivated</li>
              </ul>
              <p>
                You have a <strong className="text-foreground">14-day grace period</strong> to
                contact support if you change your mind.
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="confirm-delete"
                className="block text-sm font-medium text-foreground"
              >
                Type <span className="font-bold text-destructive">DELETE</span>{" "}
                to confirm
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={isPending}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending || confirmText !== "DELETE"}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending ? (
                  <Spinner className="mx-auto h-4 w-4" />
                ) : (
                  "Delete My Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
