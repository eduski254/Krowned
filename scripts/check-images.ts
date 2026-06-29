import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data } = await sb.from("businesses").select("id, name, cover_url, logo_url, gallery");
  if (!data) return;

  // Collect all unique URLs with their source
  const urlSources: Map<string, string[]> = new Map();

  for (const b of data) {
    if (b.cover_url) {
      const arr = urlSources.get(b.cover_url) ?? [];
      arr.push(`${b.name} (cover)`);
      urlSources.set(b.cover_url, arr);
    }
    if (b.logo_url) {
      const arr = urlSources.get(b.logo_url) ?? [];
      arr.push(`${b.name} (logo)`);
      urlSources.set(b.logo_url, arr);
    }
    let gallery: string[] = [];
    try {
      gallery = typeof b.gallery === "string" ? JSON.parse(b.gallery) : b.gallery ?? [];
    } catch {}
    if (Array.isArray(gallery)) {
      for (const u of gallery) {
        if (typeof u === "string") {
          const arr = urlSources.get(u) ?? [];
          arr.push(`${b.name} (gallery)`);
          urlSources.set(u, arr);
        }
      }
    }
  }

  console.log(`Checking ${urlSources.size} unique image URLs...\n`);

  const broken: { url: string; status: number | string; sources: string[] }[] = [];

  for (const [url, sources] of urlSources) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.status >= 400) {
        broken.push({ url, status: res.status, sources });
      }
    } catch (err: any) {
      broken.push({ url, status: err.message ?? "FETCH_ERROR", sources });
    }
  }

  if (broken.length === 0) {
    console.log("All URLs are valid!");
    return;
  }

  console.log(`Found ${broken.length} broken URLs:\n`);
  for (const b of broken) {
    console.log(`  ${b.status} | ${b.url}`);
    for (const s of b.sources) {
      console.log(`        used by: ${s}`);
    }
  }
}

main().catch(console.error);
