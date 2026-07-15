"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeForm() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const email = params.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/lead-unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground font-heading">You&apos;re unsubscribed</h1>
        <p className="mt-3 text-muted-foreground">
          No more emails from us. No hard feelings &mdash; we hope your chair stays full.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground font-heading">Unsubscribe</h1>
      <p className="mt-3 text-muted-foreground">
        Click below to stop receiving emails from Krowned{email ? ` at ${email}` : ""}.
      </p>
      <button
        onClick={handleUnsubscribe}
        disabled={status === "loading" || !email}
        className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {status === "loading" ? "Processing..." : "Unsubscribe me"}
      </button>
      {status === "error" && (
        <p className="mt-4 text-sm text-destructive">
          Something went wrong. Please try again or contact us at hello@krowned.app.
        </p>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading...</div>}>
      <UnsubscribeForm />
    </Suspense>
  );
}
