"use client";

import { useState, useTransition } from "react";
import { upsertReviewResponse } from "../actions";

export function ResponseForm({
  reviewId,
  existingResponse,
}: {
  reviewId: string;
  existingResponse: string | null;
}) {
  const [body, setBody] = useState(existingResponse ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setMessage(null);
    const fd = new FormData();
    fd.set("reviewId", reviewId);
    fd.set("body", body);

    startTransition(async () => {
      const result = await upsertReviewResponse(fd);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: existingResponse ? "Response updated." : "Response posted." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="response-body" className="block text-sm font-medium text-foreground">
        {existingResponse ? "Edit your response" : "Write a response"}
      </label>
      <textarea
        id="response-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Thank the client or address their feedback..."
        className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : existingResponse ? "Update Response" : "Post Response"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "error" ? "text-destructive" : "text-success"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
