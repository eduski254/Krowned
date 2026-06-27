import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [], unreadCount: 0 });
  }

  // Get the user's business (if any)
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ items: [], unreadCount: 0 });
  }

  // Derive notifications from recent bookings and reviews (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [bookingsRes, reviewsRes, lastReadRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, status, created_at, services(name), clients:client_id(full_name)",
      )
      .eq("business_id", business.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("reviews")
      .select("id, rating, created_at, clients:client_id(full_name)")
      .eq("business_id", business.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("read_at")
      .eq("user_id", user.id)
      .eq("type", "last_bell_read")
      .maybeSingle(),
  ]);

  type NotificationItem = {
    id: string;
    type: "booking" | "review";
    title: string;
    description: string;
    createdAt: string;
    href: string;
  };

  const items: NotificationItem[] = [];

  for (const b of bookingsRes.data ?? []) {
    const clientName =
      (b.clients as unknown as { full_name: string } | null)?.full_name ??
      "A client";
    const serviceName =
      (b.services as unknown as { name: string } | null)?.name ?? "a service";

    if (b.status === "confirmed" || b.status === "pending") {
      items.push({
        id: `booking-${b.id}`,
        type: "booking",
        title: b.status === "confirmed" ? "New booking" : "Pending booking",
        description: `${clientName} booked ${serviceName}`,
        createdAt: b.created_at,
        href: "/dashboard/business/calendar",
      });
    } else if (b.status === "cancelled") {
      items.push({
        id: `booking-${b.id}`,
        type: "booking",
        title: "Booking cancelled",
        description: `${clientName} cancelled ${serviceName}`,
        createdAt: b.created_at,
        href: "/dashboard/business/calendar",
      });
    }
  }

  for (const r of reviewsRes.data ?? []) {
    const clientName =
      (r.clients as unknown as { full_name: string } | null)?.full_name ??
      "A client";
    items.push({
      id: `review-${r.id}`,
      type: "review",
      title: "New review",
      description: `${clientName} left a ${r.rating}-star review`,
      createdAt: r.created_at,
      href: "/dashboard/business/reviews",
    });
  }

  // Sort by most recent first
  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const lastReadAt = lastReadRes.data?.read_at
    ? new Date(lastReadRes.data.read_at).getTime()
    : 0;
  const unreadCount = items.filter(
    (i) => new Date(i.createdAt).getTime() > lastReadAt,
  ).length;

  return NextResponse.json({ items: items.slice(0, 15), unreadCount });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client to upsert the "last_bell_read" marker
  // (RLS on notifications only allows SELECT/UPDATE for user, not INSERT)
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "last_bell_read")
    .maybeSingle();

  if (existing) {
    await admin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "last_bell_read",
      payload: {},
      read_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
