import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNurtureEmail,
  NURTURE_TOTAL_STEPS,
  nextSendDate,
  effectiveDailyCap,
} from "@/lib/email/nurture-templates";
import { Resend } from "resend";

const EMAIL_OUTREACH_FROM =
  process.env.EMAIL_OUTREACH_FROM ?? "Krowned <outreach@mail.krowned.app>";
const DAILY_CAP = Number(process.env.LEAD_NURTURE_DAILY_CAP) || 70;

/**
 * GET /api/cron/lead-nurture
 * Daily cron: processes the nurture drip queue.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();

  // ── Load settings ──────────────────────────────────────────────────
  const { data: settings } = await admin
    .from("crm_settings")
    .select("*")
    .limit(1)
    .single();

  if (settings?.nurture_paused) {
    return NextResponse.json({ message: "Nurture paused (kill switch)", sent: 0 });
  }

  const isDryRun = settings?.dry_run ?? false;
  const warmupStart = settings?.warmup_start_date
    ? new Date(settings.warmup_start_date)
    : null;
  const cap = effectiveDailyCap(settings?.daily_cap ?? DAILY_CAP, warmupStart);

  // ── Count already sent today ───────────────────────────────────────
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await admin
    .from("lead_emails")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", todayStart.toISOString());
  const remaining = Math.max(0, cap - (sentToday ?? 0));

  if (remaining === 0) {
    return NextResponse.json({ message: "Daily cap reached", cap, sentToday, sent: 0 });
  }

  // ── Load global suppression set ────────────────────────────────────
  const { data: suppressionRows } = await admin
    .from("email_suppression")
    .select("email");
  const suppressedEmails = new Set(
    (suppressionRows ?? []).map((r) => (r.email as string).toLowerCase()),
  );

  // ── Load existing platform users/businesses for auto-conversion ────
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const platformEmails = new Set(
    (authUsers?.users ?? []).map((u) => u.email?.toLowerCase()).filter(Boolean) as string[],
  );

  const { data: bizRows } = await admin
    .from("businesses")
    .select("id, name");
  const businesses = bizRows ?? [];

  // ── Load due leads ─────────────────────────────────────────────────
  const { data: leads } = await admin
    .from("leads")
    .select("*")
    .eq("nurture_status", "active")
    .lte("nurture_next_at", now.toISOString())
    .order("nurture_next_at", { ascending: true })
    .limit(remaining);

  if (!leads?.length) {
    return NextResponse.json({ message: "No leads due", sent: 0, cap, remaining });
  }

  let sent = 0;
  let skipped = 0;
  let converted = 0;
  let capped = 0;

  // Lazy-init Resend client only when needed
  let resend: Resend | null = null;
  function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
    return resend;
  }

  for (const lead of leads) {
    if (sent >= remaining) {
      capped++;
      continue;
    }

    const email = lead.email?.toLowerCase()?.trim();
    if (!email) {
      skipped++;
      continue;
    }

    // ── Suppression check ────────────────────────────────────────────
    if (suppressedEmails.has(email)) {
      await admin
        .from("leads")
        .update({ nurture_status: "unsubscribed" })
        .eq("id", lead.id);
      skipped++;
      continue;
    }

    // ── Auto-convert: email matches platform user ────────────────────
    if (platformEmails.has(email)) {
      // Find matching user ID
      const matchedUser = authUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email,
      );
      await admin
        .from("leads")
        .update({
          stage: "converted",
          nurture_status: "converted",
          converted_user_id: matchedUser?.id ?? null,
          converted_at: now.toISOString(),
          converted_step: lead.nurture_step,
        })
        .eq("id", lead.id);
      converted++;
      continue;
    }

    // ── Auto-convert: fuzzy business name match (pg_trgm) ────────────
    if (lead.business_name) {
      const match = businesses.find(
        (b) =>
          b.name &&
          lead.business_name &&
          similarity(b.name.toLowerCase(), lead.business_name.toLowerCase()) > 0.4,
      );
      if (match) {
        await admin
          .from("leads")
          .update({
            stage: "converted",
            nurture_status: "converted",
            converted_business_id: match.id,
            converted_at: now.toISOString(),
            converted_step: lead.nurture_step,
          })
          .eq("id", lead.id);
        converted++;
        continue;
      }
    }

    // ── Sequence complete ────────────────────────────────────────────
    if (lead.nurture_step >= NURTURE_TOTAL_STEPS) {
      await admin
        .from("leads")
        .update({ nurture_status: "completed" })
        .eq("id", lead.id);
      skipped++;
      continue;
    }

    // ── Build email ──────────────────────────────────────────────────
    const template = getNurtureEmail(lead.nurture_step, {
      name: lead.name,
      business_name: lead.business_name,
      source: lead.source,
      lead_id: lead.id,
      email,
    });

    if (!template) {
      skipped++;
      continue;
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";
    const unsubUrl = `${SITE_URL}/unsubscribe?id=${encodeURIComponent(lead.id)}&email=${encodeURIComponent(email)}`;
    const unsubPostUrl = `${SITE_URL}/api/lead-unsubscribe`;

    // ── Send or dry-run ──────────────────────────────────────────────
    let sendStatus: "sent" | "error" = "sent";
    let sendError: string | null = null;
    let resendId: string | null = null;

    if (isDryRun) {
      console.log(`[nurture/dry-run] Would send step ${lead.nurture_step} to ${email}`);
    } else {
      try {
        const r = getResend();
        if (!r) {
          sendError = "RESEND_API_KEY not set";
          sendStatus = "error";
        } else {
          const result = await r.emails.send({
            from: EMAIL_OUTREACH_FROM,
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            headers: {
              "List-Unsubscribe": `<${unsubUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });
          if (result.error) {
            sendStatus = "error";
            sendError = result.error.message;
            // Hard bounce → suppress
            if (result.error.name === "validation_error" || result.error.message?.includes("bounce")) {
              await admin.from("email_suppression").upsert(
                { email, reason: "bounced" as const, meta: { error: result.error.message } },
                { onConflict: "email" },
              );
              await admin
                .from("leads")
                .update({ nurture_status: "bounced" })
                .eq("id", lead.id);
              skipped++;
              continue;
            }
          } else {
            resendId = (result.data as { id: string })?.id ?? null;
          }
        }
      } catch (err: unknown) {
        sendStatus = "error";
        sendError = err instanceof Error ? err.message : "Unknown error";
      }
    }

    // ── Log to lead_emails ───────────────────────────────────────────
    await admin.from("lead_emails").insert({
      lead_id: lead.id,
      step: lead.nurture_step,
      subject: template.subject,
      status: sendStatus,
      error: sendError,
      resend_id: resendId,
    });

    // ── Update lead ──────────────────────────────────────────────────
    const nextStep = lead.nurture_step + 1;
    const nurtureStarted = lead.nurture_started_at
      ? new Date(lead.nurture_started_at)
      : now;
    const nextAt =
      nextStep < NURTURE_TOTAL_STEPS
        ? nextSendDate(nurtureStarted, nextStep)
        : null;

    await admin
      .from("leads")
      .update({
        nurture_step: nextStep,
        last_contacted_at: now.toISOString(),
        nurture_started_at: lead.nurture_started_at ?? now.toISOString(),
        nurture_next_at: nextAt?.toISOString() ?? null,
        stage: lead.stage === "new" ? "contacted" : lead.stage,
        nurture_status:
          nextStep >= NURTURE_TOTAL_STEPS ? "completed" : "active",
      })
      .eq("id", lead.id);

    if (sendStatus === "sent") sent++;
    else skipped++;
  }

  const result = {
    processed: leads.length,
    sent,
    skipped,
    converted,
    capped,
    dry_run: isDryRun,
    cap,
  };
  console.log("[cron/lead-nurture]", result);
  return NextResponse.json(result);
}

/** Simple trigram-like similarity (JS-side approximation of pg_trgm). */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const trigramsA = new Set<string>();
  const trigramsB = new Set<string>();
  for (let i = 0; i <= a.length - 3; i++) trigramsA.add(a.slice(i, i + 3));
  for (let i = 0; i <= b.length - 3; i++) trigramsB.add(b.slice(i, i + 3));
  let intersection = 0;
  for (const t of trigramsA) if (trigramsB.has(t)) intersection++;
  return intersection / (trigramsA.size + trigramsB.size - intersection);
}
