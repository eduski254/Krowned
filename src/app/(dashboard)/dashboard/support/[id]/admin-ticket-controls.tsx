"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { updateTicket } from "@/lib/support/actions";

interface Props {
  ticketId: string;
  currentStatus: string;
  currentPriority: string;
}

export function AdminTicketControls({ ticketId, currentStatus, currentPriority }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(status: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateTicket({ ticketId, status: status as any });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handlePriorityChange(priority: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateTicket({ ticketId, priority: priority as any });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Admin Controls</h3>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Status</label>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Priority</label>
          <select
            value={currentPriority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            disabled={isPending}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {isPending && <Spinner className="h-4 w-4 self-end mb-2" />}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
