"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { IDLE_TIMEOUT_MS } from "@/lib/session-config";
import { useRouter } from "next/navigation";

/**
 * Client-side idle timeout watcher.
 *
 * Resets a timer on real user activity (mouse, keyboard, touch, scroll).
 * When the timer expires, signs the user out and redirects to /login with
 * an inactivity message. Does NOT interfere with Supabase's token refresh —
 * this is a UI-level idle layer on top.
 *
 * Does NOT fire on mere tab visibility change (only on actual interaction).
 */
export function IdleTimeout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login?message=" + encodeURIComponent("You were signed out due to inactivity."));
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleSignOut, IDLE_TIMEOUT_MS);
  }, [handleSignOut]);

  useEffect(() => {
    // Activity events that reset the idle timer
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    // Throttle: only reset once per 30 seconds to avoid excessive timer resets
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 30_000) {
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
    };
  }, [resetTimer]);

  // This component renders nothing
  return null;
}
