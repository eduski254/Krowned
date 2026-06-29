"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Insert a notification for a user.
 * All notification data goes into `payload` (jsonb).
 * Fire-and-forget: logs errors but never throws.
 */
export async function createNotification(opts: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: opts.userId,
      type: opts.type,
      payload: {
        title: opts.title,
        body: opts.body,
        href: opts.href ?? null,
        ...opts.meta,
      },
    });
  } catch (err) {
    console.error("[notify] Failed to create notification:", err);
  }
}

/**
 * Insert the same notification for multiple users.
 */
export async function createNotificationBulk(
  userIds: string[],
  opts: {
    type: string;
    title: string;
    body: string;
    href?: string;
    meta?: Record<string, unknown>;
  },
) {
  if (userIds.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert(
      userIds.map((uid) => ({
        user_id: uid,
        type: opts.type,
        payload: {
          title: opts.title,
          body: opts.body,
          href: opts.href ?? null,
          ...opts.meta,
        },
      })),
    );
  } catch (err) {
    console.error("[notify] Failed to create bulk notifications:", err);
  }
}
