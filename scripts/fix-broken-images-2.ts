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
  // Fix the remaining broken ID: photo-1599351431613-0fac8d668740
  // Replace with a verified working barber/hair photo
  const oldId = "photo-1599351431613-0fac8d668740";
  const newId = "photo-1622288432450-277d0fef5ed6"; // hair styling - verified working

  const { data: businesses } = await sb
    .from("businesses")
    .select("id, name, cover_url, logo_url, gallery");

  let fixed = 0;
  for (const biz of businesses ?? []) {
    let changed = false;
    let coverUrl = biz.cover_url;
    let logoUrl = biz.logo_url;
    let gallery: string[] = [];
    try {
      gallery = typeof biz.gallery === "string" ? JSON.parse(biz.gallery) : biz.gallery ?? [];
    } catch { gallery = []; }

    if (coverUrl?.includes(oldId)) { coverUrl = coverUrl.replace(oldId, newId); changed = true; }
    if (logoUrl?.includes(oldId)) { logoUrl = logoUrl.replace(oldId, newId); changed = true; }
    const newGallery = gallery.map((u: string) => {
      if (u.includes(oldId)) { changed = true; return u.replace(oldId, newId); }
      return u;
    });

    if (changed) {
      await sb.from("businesses").update({ cover_url: coverUrl, logo_url: logoUrl, gallery: JSON.stringify(newGallery) }).eq("id", biz.id);
      console.log(`  ✓ ${biz.name}`);
      fixed++;
    }
  }
  console.log(`Fixed ${fixed} businesses.`);

  // Final verification
  console.log("\nFinal verification...");
  const { data: all } = await sb.from("businesses").select("cover_url, logo_url, gallery");
  const urls = new Set<string>();
  for (const b of all ?? []) {
    if (b.cover_url) urls.add(b.cover_url);
    if (b.logo_url) urls.add(b.logo_url);
    let g: string[] = [];
    try { g = typeof b.gallery === "string" ? JSON.parse(b.gallery) : b.gallery ?? []; } catch {}
    for (const u of g) if (typeof u === "string") urls.add(u);
  }
  let broken = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.status >= 400) { console.log(`  BROKEN: ${res.status} ${url.substring(0, 80)}`); broken++; }
    } catch { broken++; }
  }
  console.log(broken === 0 ? "All URLs valid!" : `${broken} still broken`);
}

main().catch(console.error);
