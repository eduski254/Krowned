import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/lead-unsubscribe
 * Public endpoint. Idempotent. No auth required (link-based unsubscribe).
 * Body: { id: string, email: string }
 */
export async function POST(request: Request) {
  try {
    const { id, email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Upsert into global suppression list
    await admin.from("email_suppression").upsert(
      { email: email.toLowerCase().trim(), reason: "unsubscribed" },
      { onConflict: "email" },
    );

    // Update lead nurture_status if we have a valid lead ID
    if (id && typeof id === "string") {
      await admin
        .from("leads")
        .update({ nurture_status: "unsubscribed" })
        .eq("id", id);
    } else {
      // Find by email fallback
      await admin
        .from("leads")
        .update({ nurture_status: "unsubscribed" })
        .eq("email", email.toLowerCase().trim());
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
