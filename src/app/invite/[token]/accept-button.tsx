"use client";

import { useTransition } from "react";
import { Spinner } from "@/components/spinner";
import { acceptStaffInvite } from "./actions";

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => acceptStaffInvite(token))}
      disabled={isPending}
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {isPending ? (
        <>
          <Spinner className="h-4 w-4" /> Accepting...
        </>
      ) : (
        "Accept Invitation"
      )}
    </button>
  );
}
