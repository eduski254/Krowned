import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventType, email } = body as {
    eventType: string;
    email: boolean;
  };

  if (!eventType || typeof email !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Upsert the preference row
  const { error } = await admin.from("notification_preferences").upsert(
    {
      user_id: user.id,
      event_type: eventType,
      email,
      in_app: true,
    },
    { onConflict: "user_id,event_type" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
