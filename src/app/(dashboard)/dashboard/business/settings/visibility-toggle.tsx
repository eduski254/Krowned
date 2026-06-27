"use client";

import { useTransition } from "react";
import { toggleVisibility } from "./actions";

export function VisibilityToggle({
  businessId,
  isPublished,
}: {
  businessId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const fd = new FormData();
    fd.set("businessId", businessId);
    fd.set("isPublished", (!isPublished).toString());
    startTransition(async () => {
      await toggleVisibility(fd);
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-foreground">
          {isPublished
            ? "Your business is visible in the public directory."
            : "Your business is hidden from the public directory."}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isPublished
            ? "Clients can find you on the explore page and book your services."
            : "Toggle on to appear in search results and accept bookings."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isPublished}
        aria-label="Toggle business visibility"
        disabled={isPending}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 ${
          isPublished ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
            isPublished ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
