import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Returns unread counts for sidebar badges:
 * - support: unread support ticket notifications
 * - total: total unread notifications
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ support: 0, total: 0 });
  }

  const admin = createAdminClient();

  // Get unread notifications (read_at IS NULL)
  const { data: unread } = await admin
    .from("notifications")
    .select("type")
    .eq("user_id", user.id)
    .neq("type", "last_bell_read")
    .is("read_at", null);

  const counts = { support: 0, total: 0 };

  for (const n of unread ?? []) {
    counts.total++;
    if (
      n.type === "support_ticket" ||
      n.type === "support_reply" ||
      n.type === "support_update"
    ) {
      counts.support++;
    }
  }

  return NextResponse.json(counts);
}
