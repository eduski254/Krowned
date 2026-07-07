"use client";

import { useTransition } from "react";
import { Eye, X } from "lucide-react";
import { stopImpersonation } from "@/lib/impersonate";

export function ImpersonationBanner({
  targetName,
  targetRole,
}: {
  targetName: string;
  targetRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 bg-warning px-4 py-2 text-warning-foreground">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        <span>
          Viewing as <strong>{targetName}</strong> ({targetRole})
        </span>
      </div>
      <button
        onClick={() => startTransition(() => stopImpersonation())}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md bg-background/20 px-3 py-1 text-xs font-semibold hover:bg-background/30 transition-colors disabled:opacity-50"
      >
        <X className="h-3 w-3" />
        {isPending ? "Exiting..." : "Exit"}
      </button>
    </div>
  );
}
