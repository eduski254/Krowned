import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/mark-read
 * Body: { types: string[] }
 * Marks all unread notifications of the given types as read for the current user.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const types: string[] = body.types ?? [];

  if (types.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("type", types)
    .is("read_at", null);

  return NextResponse.json({ ok: true });
}
