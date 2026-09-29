/**
 * Send "Claim Your Business" emails to business owners.
 *
 * Usage:
 *   npx tsx scripts/send-claim-emails.ts --sample          # send 1 sample to super admin
 *   npx tsx scripts/send-claim-emails.ts --dry-run         # preview all, send nothing
 *   npx tsx scripts/send-claim-emails.ts --send            # send to all with emails
 *   npx tsx scripts/send-claim-emails.ts --send --batch=20 # send in batches of 20
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { claimBusinessEmail } from "../src/lib/email/templates";
import * as fs from "fs";
import * as path from "path";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";
const SUPER_ADMIN_EMAIL = "edwinnchaga@gmail.com";
const SENT_LOG_PATH = path.join(__dirname, "claim-emails-sent.log");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// ── Sent log (prevents double-sends across batches) ─────────────────

function loadSentLog(): Set<string> {
  if (!fs.existsSync(SENT_LOG_PATH)) return new Set();
  return new Set(
    fs.readFileSync(SENT_LOG_PATH, "utf-8").split("\n").filter(Boolean),
  );
}

function appendSentLog(businessId: string) {
  fs.appendFileSync(SENT_LOG_PATH, businessId + "\n");
}

// ── Load email lookup from CSV ──────────────────────────────────────

function loadEmailCsv(): Map<string, string> {
  const csvPath = path.join(__dirname, "outreach-emails.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n").slice(1);
  const map = new Map<string, string>();
  for (const line of lines) {
    if (!line.trim()) continue;
    const firstComma = line.indexOf(",");
    const secondComma = line.indexOf(",", firstComma + 1);
    const name = line.slice(0, firstComma).trim();
    const email = line.slice(firstComma + 1, secondComma).trim();
    if (email && email.includes("@")) {
      map.set(name, email);
    }
  }
  return map;
}

// ── Fetch unclaimed businesses from DB ──────────────────────────────

async function getUnclaimedBusinesses() {
  const { data, error } = await sb
    .from("businesses")
    .select("id, name, slug")
    .eq("claimed", false)
    .eq("is_published", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

// ── Send one email ──────────────────────────────────────────────────

async function sendClaimEmail(
  to: string,
  businessName: string,
  businessId: string,
  slug: string,
): Promise<boolean> {
  const profileUrl = `${SITE_URL}/b/${slug}`;
  const claimUrl = `${SITE_URL}/claim/${businessId}`;

  const { subject, html, text } = claimBusinessEmail({
    businessName,
    profileUrl,
    claimUrl,
  });

  const { error } = await resend.emails.send({
    from: "Krowned <hello@krowned.app>",
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error(`  FAILED [${businessName}] → ${to}:`, error.message);
    return false;
  }
  return true;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isSample = args.includes("--sample");
  const isDryRun = args.includes("--dry-run");
  const isSend = args.includes("--send");
  const batchArg = args.find((a) => a.startsWith("--batch="));
  const batchSize = batchArg ? parseInt(batchArg.split("=")[1], 10) : Infinity;

  if (!isSample && !isDryRun && !isSend) {
    console.log("Usage:");
    console.log("  npx tsx scripts/send-claim-emails.ts --sample");
    console.log("  npx tsx scripts/send-claim-emails.ts --dry-run");
    console.log("  npx tsx scripts/send-claim-emails.ts --send");
    console.log("  npx tsx scripts/send-claim-emails.ts --send --batch=20");
    process.exit(1);
  }

  const emailMap = loadEmailCsv();
  const businesses = await getUnclaimedBusinesses();

  console.log(`\nFound ${businesses.length} unclaimed businesses`);
  console.log(`Email CSV has ${emailMap.size} emails loaded\n`);

  // ── Sample mode: send one test to super admin ──
  if (isSample) {
    const sample = businesses[0];
    if (!sample) {
      console.log("No unclaimed businesses found.");
      return;
    }

    console.log(`Sending SAMPLE email to ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Business: ${sample.name}`);
    console.log(`  Profile:  ${SITE_URL}/b/${sample.slug}`);
    console.log(`  Claim:    ${SITE_URL}/claim/${sample.id}\n`);

    const ok = await sendClaimEmail(
      SUPER_ADMIN_EMAIL,
      sample.name,
      sample.id,
      sample.slug,
    );
    console.log(
      ok ? "Sample sent! Check your inbox." : "Failed to send sample.",
    );
    return;
  }

  // ── Match businesses to emails (skip already sent) ──
  const sentLog = loadSentLog();
  const matched: {
    name: string;
    id: string;
    slug: string;
    email: string;
  }[] = [];
  const unmatched: string[] = [];
  let skipped = 0;

  for (const biz of businesses) {
    if (sentLog.has(biz.id)) {
      skipped++;
      continue;
    }
    const email = emailMap.get(biz.name);
    if (email) {
      matched.push({ name: biz.name, id: biz.id, slug: biz.slug, email });
    } else {
      unmatched.push(biz.name);
    }
  }

  console.log(`Matched: ${matched.length} businesses with emails`);
  console.log(`Already sent: ${skipped} (skipped)`);
  console.log(`No email: ${unmatched.length} businesses\n`);

  // ── Dry run ──
  if (isDryRun) {
    console.log("=== DRY RUN (no emails sent) ===\n");
    for (const m of matched) {
      console.log(`  ${m.name} → ${m.email}`);
    }
    console.log(`\n--- No email found (${unmatched.length}): ---`);
    for (const u of unmatched) {
      console.log(`  ${u}`);
    }
    return;
  }

  // ── Send mode ──
  const toSend = matched.slice(0, batchSize);
  console.log(`Sending ${toSend.length} emails...\n`);

  let sent = 0;
  let failed = 0;

  for (const m of toSend) {
    console.log(
      `  [${sent + failed + 1}/${toSend.length}] ${m.name} → ${m.email}`,
    );
    const ok = await sendClaimEmail(m.email, m.name, m.id, m.slug);
    if (ok) {
      sent++;
      appendSentLog(m.id);
    } else {
      failed++;
    }
    // Rate limit: Resend free tier = 2/sec
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
  if (matched.length > toSend.length) {
    console.log(
      `Remaining: ${matched.length - toSend.length} (use --batch=${batchSize} to send more)`,
    );
  }
}

main().catch(console.error);
