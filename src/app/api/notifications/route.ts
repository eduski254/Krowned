import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  href: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [], unreadCount: 0 });
  }

  const admin = createAdminClient();

  // Fetch real notifications from the DB (last 30 days, max 30)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [notifRes, lastReadRes, businessRes] = await Promise.all([
    admin
      .from("notifications")
      .select("id, type, payload, read_at, created_at")
      .eq("user_id", user.id)
      .neq("type", "last_bell_read")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("notifications")
      .select("read_at")
      .eq("user_id", user.id)
      .eq("type", "last_bell_read")
      .maybeSingle(),
    supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  const items: NotificationItem[] = [];

  // Add real DB notifications
  for (const n of notifRes.data ?? []) {
    const payload = (n.payload ?? {}) as Record<string, unknown>;
    items.push({
      id: n.id,
      type: n.type,
      title: (payload.title as string) || n.type,
      description: (payload.body as string) || "",
      createdAt: n.created_at,
      href: (payload.href as string) || "/dashboard",
    });
  }

  // Also derive from recent bookings and reviews (for business owners)
  if (businessRes.data) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [bookingsRes, reviewsRes] = await Promise.all([
      admin
        .from("bookings")
        .select(
          "id, status, created_at, services(name), clients:client_id(full_name), contact:contact_id(name)",
        )
        .eq("business_id", businessRes.data.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(15),
      admin
        .from("reviews")
        .select("id, rating, created_at, clients:client_id(full_name)")
        .eq("business_id", businessRes.data.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    for (const b of bookingsRes.data ?? []) {
      const clientName =
        (b.clients as unknown as { full_name: string } | null)?.full_name ??
        (b.contact as unknown as { name: string } | null)?.name ??
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
  }

  // Sort by most recent first
  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const lastReadAt = lastReadRes.data?.read_at
    ? new Date(lastReadRes.data.read_at).getTime()
    : 0;
  const unreadCount = items.filter(
    (i) => new Date(i.createdAt).getTime() > lastReadAt,
  ).length;

  return NextResponse.json({ items: items.slice(0, 20), unreadCount });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
