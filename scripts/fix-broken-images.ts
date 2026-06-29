import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Map broken image IDs to working replacements (verified Unsplash photos)
const REPLACEMENTS: Record<string, string> = {
  // photo-1585747860019 → hair salon interior
  "photo-1585747860019-8e09b4c6e8b0":
    "photo-1633681926022-84c23e8cb2d6",
  // photo-1521590832167 → barber cutting hair
  "photo-1521590832167-7228fcb0c124":
    "photo-1599351431613-0fac8d668740",
  // photo-1540555700478 → spa candles
  "photo-1540555700478-4be289fbec6d":
    "photo-1600334089648-b0d9d3028eb2",
  // photo-1629196914168 → skincare treatment
  "photo-1629196914168-3a2db17ac40c":
    "photo-1612817288484-6f916006741a",
  // photo-1457972851104 → makeup brushes
  "photo-1457972851104-2d51b303a0b2":
    "photo-1526045478516-99145907023c",
};

async function main() {
  console.log("Fixing broken image URLs...\n");

  const { data: businesses } = await sb
    .from("businesses")
    .select("id, name, cover_url, logo_url, gallery");

  if (!businesses) return;

  let fixed = 0;

  for (const biz of businesses) {
    let changed = false;
    let coverUrl = biz.cover_url;
    let logoUrl = biz.logo_url;
    let gallery: string[] = [];
    try {
      gallery =
        typeof biz.gallery === "string"
          ? JSON.parse(biz.gallery)
          : biz.gallery ?? [];
    } catch {
      gallery = [];
    }

    // Fix cover_url
    if (coverUrl) {
      const newCover = replaceUrl(coverUrl);
      if (newCover !== coverUrl) {
        coverUrl = newCover;
        changed = true;
      }
    }

    // Fix logo_url
    if (logoUrl) {
      const newLogo = replaceUrl(logoUrl);
      if (newLogo !== logoUrl) {
        logoUrl = newLogo;
        changed = true;
      }
    }

    // Fix gallery
    const newGallery = gallery.map((url: string) => {
      const replaced = replaceUrl(url);
      if (replaced !== url) changed = true;
      return replaced;
    });

    if (changed) {
      const { error } = await sb
        .from("businesses")
        .update({
          cover_url: coverUrl,
          logo_url: logoUrl,
          gallery: JSON.stringify(newGallery),
        })
        .eq("id", biz.id);

      if (error) {
        console.log(`  ✗ ${biz.name}: ${error.message}`);
      } else {
        console.log(`  ✓ ${biz.name}`);
        fixed++;
      }
    }
  }

  console.log(`\nFixed ${fixed} businesses.`);

  // Verify no more broken URLs
  console.log("\nVerifying all URLs...");
  const { data: updated } = await sb
    .from("businesses")
    .select("cover_url, logo_url, gallery");
  const allUrls = new Set<string>();
  for (const b of updated ?? []) {
    if (b.cover_url) allUrls.add(b.cover_url);
    if (b.logo_url) allUrls.add(b.logo_url);
    let g: string[] = [];
    try { g = typeof b.gallery === "string" ? JSON.parse(b.gallery) : b.gallery ?? []; } catch {}
    for (const u of g) if (typeof u === "string") allUrls.add(u);
  }

  let stillBroken = 0;
  for (const url of allUrls) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.status >= 400) {
        console.log(`  Still broken: ${res.status} ${url.substring(0, 80)}`);
        stillBroken++;
      }
    } catch {
      stillBroken++;
    }
  }

  if (stillBroken === 0) {
    console.log("All image URLs are now valid!");
  } else {
    console.log(`${stillBroken} URLs still broken.`);
  }
}

function replaceUrl(url: string): string {
  for (const [oldId, newId] of Object.entries(REPLACEMENTS)) {
    if (url.includes(oldId)) {
      return url.replace(oldId, newId);
    }
  }
  return url;
}

main().catch(console.error);
