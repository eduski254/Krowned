import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const SITE = "https://krowned.app";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function loginAndTest(email: string, password: string, label: string, paths: string[]) {
  console.log(`\n=== ${label} (${email}) ===`);

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr || !auth.session) {
    console.error("  LOGIN FAILED:", authErr?.message);
    return;
  }

  const token = auth.session.access_token;
  const refresh = auth.session.refresh_token;

  // Build cookie string matching Supabase SSR chunked format
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1].split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = JSON.stringify({
    access_token: token,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: auth.session.expires_at,
  });

  const encoded = encodeURIComponent(cookieValue);
  const CHUNK_SIZE = 3500;
  const chunks: string[] = [];
  for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
    chunks.push(encoded.slice(i, i + CHUNK_SIZE));
  }

  let cookieStr: string;
  if (chunks.length === 1) {
    cookieStr = `${cookieName}=${chunks[0]}`;
  } else {
    cookieStr = chunks.map((c, i) => `${cookieName}.${i}=${c}`).join("; ");
  }

  for (const path of paths) {
    try {
      const res = await fetch(`${SITE}${path}`, {
        headers: { Cookie: cookieStr },
        redirect: "manual",
      });
      const status = res.status;
      const location = res.headers.get("location") ?? "";

      if (status === 200) {
        const html = await res.text();
        const hasError =
          html.includes("Application error") ||
          html.includes("Internal Server Error") ||
          html.includes("NEXT_NOT_FOUND") ||
          html.includes("__next_error__");
        const size = (html.length / 1024).toFixed(0);
        if (hasError) {
          // Try to extract error message
          const match = html.match(/(?:error|Error)[^<]*<[^>]*>([^<]+)/);
          console.log(`  ${path} → ${status} ⚠️  ERROR (${size}KB) ${match?.[1] ?? ""}`);
        } else {
          console.log(`  ${path} → ${status} ✓ (${size}KB)`);
        }
      } else if (status >= 300 && status < 400) {
        console.log(`  ${path} → ${status} redirect → ${location}`);
      } else {
        console.log(`  ${path} → ${status} ✗`);
      }
    } catch (e: any) {
      console.log(`  ${path} → FETCH ERROR: ${e.message}`);
    }
  }

  await supabase.auth.signOut();
}

async function main() {
  // Client dashboard
  await loginAndTest("test.client@krowned.app", "TestKrowned123!", "CLIENT DASHBOARD", [
    "/dashboard",
    "/dashboard/bookings",
    "/dashboard/favorites",
    "/dashboard/settings",
  ]);

  // Business owner dashboard
  await loginAndTest("test.owner@krowned.app", "TestKrowned123!", "BUSINESS OWNER DASHBOARD", [
    "/dashboard",
    "/dashboard/business",
    "/dashboard/business/calendar",
    "/dashboard/business/services",
    "/dashboard/business/staff",
    "/dashboard/business/clients",
    "/dashboard/business/reviews",
    "/dashboard/business/earnings",
    "/dashboard/business/settings",
    "/dashboard/business/profile",
  ]);

  // Staff dashboard
  await loginAndTest("test.staff@krowned.app", "TestKrowned123!", "STAFF DASHBOARD", [
    "/dashboard",
  ]);

  // Admin dashboard
  await loginAndTest("test.admin@krowned.app", "TestKrowned123!", "ADMIN DASHBOARD", [
    "/dashboard",
    "/dashboard/admin",
    "/dashboard/admin/businesses",
    "/dashboard/admin/users",
    "/dashboard/admin/bookings",
    "/dashboard/admin/categories",
    "/dashboard/admin/finance",
    "/dashboard/admin/blog",
  ]);
}

main();
