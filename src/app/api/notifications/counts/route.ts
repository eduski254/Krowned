import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Returns unread counts for sidebar badges:
 * - support: unread support ticket notifications
 * - bookings: new bookings in last 24h (for business owners)
 * - total: total unread notifications
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ support: 0, bookings: 0, total: 0 });
  }

  const admin = createAdminClient();

  // Get unread notifications (read_at IS NULL)
  const { data: unread } = await admin
    .from("notifications")
    .select("type")
    .eq("user_id", user.id)
    .neq("type", "last_bell_read")
    .is("read_at", null);

  const counts = { support: 0, bookings: 0, total: 0 };

  for (const n of unread ?? []) {
    counts.total++;
    if (
      n.type === "support_ticket" ||
      n.type === "support_reply" ||
      n.type === "support_update"
    ) {
      counts.support++;
    }
    if (n.type === "booking") {
      counts.bookings++;
    }
  }

  // Also count recent confirmed bookings for business owners (last 24h)
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (business) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "confirmed")
      .gte("created_at", oneDayAgo.toISOString());

    counts.bookings = Math.max(counts.bookings, count ?? 0);
  }

  return NextResponse.json(counts);
}
