import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/resend
 * Handles Resend delivery events: bounces + complaints → suppress email.
 */
export async function POST(request: Request) {
  const body = await request.text();

  // Verify webhook signature if secret is configured
  if (RESEND_WEBHOOK_SECRET) {
    const signature = request.headers.get("svix-signature");
    const timestamp = request.headers.get("svix-timestamp");
    const msgId = request.headers.get("svix-id");

    if (!signature || !timestamp || !msgId) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const signedContent = `${msgId}.${timestamp}.${body}`;
    const expectedSigs = signature.split(" ");
    const verified = expectedSigs.some((sig) => {
      const parts = sig.split(",");
      const sigBytes = parts[1];
      if (!sigBytes) return false;
      const secretBytes = Buffer.from(
        RESEND_WEBHOOK_SECRET.startsWith("whsec_")
          ? RESEND_WEBHOOK_SECRET.slice(6)
          : RESEND_WEBHOOK_SECRET,
        "base64",
      );
      const computed = crypto
        .createHmac("sha256", secretBytes)
        .update(signedContent)
        .digest("base64");
      return computed === sigBytes;
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "email.bounced") {
    const to = extractEmail(event.data);
    if (to) {
      await admin.from("email_suppression").upsert(
        { email: to, reason: "bounced" as const, meta: event.data },
        { onConflict: "email" },
      );
      await admin
        .from("leads")
        .update({ nurture_status: "bounced" })
        .eq("email", to);
      console.log(`[resend-webhook] Bounced: ${to}`);
    }
  }

  if (event.type === "email.complained") {
    const to = extractEmail(event.data);
    if (to) {
      await admin.from("email_suppression").upsert(
        { email: to, reason: "complained" as const, meta: event.data },
        { onConflict: "email" },
      );
      await admin
        .from("leads")
        .update({ nurture_status: "unsubscribed" })
        .eq("email", to);
      console.log(`[resend-webhook] Complaint: ${to}`);
    }
  }

  return NextResponse.json({ ok: true });
}

function extractEmail(data: Record<string, unknown>): string | null {
  // Resend sends `to` as string[] or string
  const to = data.to;
  if (Array.isArray(to)) return (to[0] as string)?.toLowerCase() ?? null;
  if (typeof to === "string") return to.toLowerCase();
  const email = data.email;
  if (typeof email === "string") return email.toLowerCase();
  return null;
}
