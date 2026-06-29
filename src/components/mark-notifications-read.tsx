"use client";

import { useEffect } from "react";

/**
 * Drop this component on a page to mark specific notification types as read
 * when the user visits that page.
 */
export function MarkNotificationsRead({ types }: { types: string[] }) {
  useEffect(() => {
    fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ types }),
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
