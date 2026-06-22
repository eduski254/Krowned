/**
 * Verify dashboards render correctly for each test account.
 * Authenticates as each user, fetches their dashboard pages, checks for errors.
 *
 * Run: npx tsx scripts/verify-dashboards.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE = "http://localhost:3000";
const PASSWORD = "Test1234!";

interface Check {
  role: string;
  email: string;
  pages: string[];
}

const CHECKS: Check[] = [
  {
    role: "Client",
    email: "client@zawaditest.com",
    pages: [
      "/dashboard",
      "/dashboard/bookings",
      "/dashboard/favorites",
      "/dashboard/reviews",
      "/dashboard/payments",
      "/dashboard/profile",
      "/dashboard/settings",
    ],
  },
  {
    role: "Business Owner",
    email: "owner@zawaditest.com",
    pages: [
      "/dashboard/business",
      "/dashboard/business/calendar",
      "/dashboard/business/services",
      "/dashboard/business/staff",
      "/dashboard/business/clients",
      "/dashboard/business/earnings",
      "/dashboard/business/reviews",
      "/dashboard/business/profile",
      "/dashboard/business/payments",
      "/dashboard/business/settings",
    ],
  },
  {
    role: "Staff",
    email: "staff@zawaditest.com",
    pages: [
      "/dashboard/staff",
      "/dashboard/staff/schedule",
      "/dashboard/staff/appointments",
      "/dashboard/staff/clients",
      "/dashboard/staff/performance",
      "/dashboard/staff/earnings",
      "/dashboard/staff/profile",
    ],
  },
  {
    role: "Super Admin",
    email: "admin@zawaditest.com",
    pages: [
      "/dashboard/admin",
      "/dashboard/admin/businesses",
      "/dashboard/admin/users",
      "/dashboard/admin/bookings",
      "/dashboard/admin/categories",
      "/dashboard/admin/reviews",
      "/dashboard/admin/finance",
      "/dashboard/admin/disputes",
      "/dashboard/admin/settings",
    ],
  },
];

// Public pages (no auth needed)
const PUBLIC_PAGES = [
  "/",
  "/explore",
  "/b/sarah-beauty-studio",
  "/book/test-booking-token-sarah",
  "/how-it-works",
  "/for-professionals",
  "/contact",
];

async function getSessionCookie(email: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`Auth failed for ${email}: ${error?.message}`);
  }

  // @supabase/ssr stores session as: "base64-" + base64url(JSON.stringify(session))
  // Chunked at 3180 URL-encoded chars per cookie.
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionJson = JSON.stringify(data.session);
  const cookieValue = "base64-" + Buffer.from(sessionJson).toString("base64url");

  // Use the same chunking logic as @supabase/ssr: split by URL-encoded length
  const CHUNK_SIZE = 3180;
  const urlEncoded = encodeURIComponent(cookieValue);

  if (urlEncoded.length <= CHUNK_SIZE) {
    return `${cookieName}=${cookieValue}`;
  }

  // Need to chunk — split the value into pieces that fit when URL-encoded
  const chunks: string[] = [];
  let remaining = cookieValue;
  let i = 0;

  while (remaining.length > 0) {
    // Binary search for max decoded chars that fit in CHUNK_SIZE when encoded
    let lo = 0;
    let hi = remaining.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (encodeURIComponent(remaining.slice(0, mid)).length <= CHUNK_SIZE) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    chunks.push(`${cookieName}.${i}=${remaining.slice(0, lo)}`);
    remaining = remaining.slice(lo);
    i++;
  }

  return chunks.join("; ");
}

async function checkPage(
  url: string,
  cookie: string,
): Promise<{ path: string; status: number; ok: boolean; error?: string }> {
  const path = url.replace(BASE, "");
  try {
    const res = await fetch(url, {
      headers: cookie ? { Cookie: cookie } : {},
      redirect: "manual",
    });
    const status = res.status;

    if (status >= 500) {
      const body = await res.text();
      const match = body.match(/Error: (.*?)(?:<|$)/);
      return { path, status, ok: false, error: match?.[1] ?? "Server error" };
    }

    if (status >= 300 && status < 400) {
      const location = res.headers.get("location") ?? "unknown";
      const isAuthRedirect = location.includes("/login");
      return {
        path,
        status,
        ok: !isAuthRedirect,
        error: isAuthRedirect ? `Redirected to ${location}` : `-> ${location}`,
      };
    }

    const body = await res.text();
    const hasContent = body.length > 500;
    const hasError = body.includes("Application error") || body.includes("Internal Server Error");

    // Extract some data indicators from the HTML
    const dataHints: string[] = [];
    if (body.includes("Sarah")) dataHints.push("Sarah");
    if (body.includes("Blowout") || body.includes("Braids")) dataHints.push("services");
    if (body.includes("David")) dataHints.push("David");
    if (body.includes("Amina")) dataHints.push("Amina");
    if (body.includes("$45") || body.includes("4500") || body.includes("$50")) dataHints.push("money");
    if (body.includes("booking") || body.includes("Booking")) dataHints.push("bookings");
    if (body.includes("5 stars") || body.includes("rating") || body.includes("★")) dataHints.push("reviews");
    const hint = dataHints.length > 0 ? ` [data: ${dataHints.join(", ")}]` : "";

    return {
      path,
      status,
      ok: hasContent && !hasError,
      error: hasError ? "Application error in page" : !hasContent ? "Empty page body" : hint || undefined,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { path, status: 0, ok: false, error: msg };
  }
}

async function main() {
  console.log("\nVerifying dashboards against http://localhost:3000\n");

  // 1. Public pages first (no auth)
  console.log("PUBLIC PAGES");
  console.log("─".repeat(60));
  for (const path of PUBLIC_PAGES) {
    const result = await checkPage(`${BASE}${path}`, "");
    const icon = result.ok ? "✅" : "❌";
    const detail = result.error ? ` (${result.error})` : "";
    console.log(`  ${icon} ${result.status} ${result.path}${detail}`);
  }

  // 2. Authenticated dashboards
  for (const check of CHECKS) {
    console.log(`\n${check.role.toUpperCase()} — ${check.email}`);
    console.log("─".repeat(60));

    let cookie: string;
    try {
      cookie = await getSessionCookie(check.email);
      console.log(`  🔑 Authenticated`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ❌ Auth failed: ${msg}`);
      continue;
    }

    for (const path of check.pages) {
      const result = await checkPage(`${BASE}${path}`, cookie);
      const icon = result.ok ? "✅" : "❌";
      const detail = result.error ? ` (${result.error})` : "";
      console.log(`  ${icon} ${result.status} ${result.path}${detail}`);
    }
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("Verify failed:", err.message);
  process.exit(1);
});
