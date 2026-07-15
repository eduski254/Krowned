/**
 * Update all seeded business listings with curated, category-relevant
 * Unsplash images — braids, locs, fades, natural hair, salon interiors, etc.
 *
 * Run: npx tsx scripts/seed-listing-images.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Curated Unsplash image pools by category ────────────────────────

function u(id: string, w = 800) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fit=crop`;
}

// Braids & protective styling — knotless, box braids, cornrows, twists
const BRAIDS_COVERS = [
  u("1487412720507-e7ab37603c6f"),    // Black woman braids close-up
  u("1596178065887-1198b6148b2b"),    // Braided hair styling
  u("1617137968427-85924c800a22"),    // Protective braids portrait
  u("1524504388940-b1c1722653e1"),    // Braids hairstyle
  u("1580618672591-eb180b1a973f"),    // Hair styling session
  u("1493256338651-d82f7acb2b38"),    // Beautiful braids portrait
];

const BRAIDS_GALLERY = [
  u("1605497788044-5a32c7078486"),    // Braiding in progress
  u("1560066984-138dadb4c035"),      // Black woman natural hair
  u("1522337360788-8b13dee7a37e"),    // Hair styling tools
  u("1634449571010-02389ed0f9b0"),    // Salon interior
  u("1562004760-aceed7bb0fe3"),      // Braided updo
  u("1534008757030-27299c4371b6"),    // Cornrows close-up
  u("1516975080664-ed2fc6a32937"),    // Salon tools
  u("1527799820374-dcf8d9d4a388"),    // Hair products
  u("1580489944761-15a19d654956"),    // Protective style
  u("1595515106969-1ce29566ff1c"),    // Box braids
];

// Locs — freeform, traditional, retwist, starter locs
const LOCS_COVERS = [
  u("1507003211169-0a1dd7228f2d"),    // Man with locs portrait
  u("1506634572416-48cdfe530110"),    // Locs close-up
  u("1531746020798-e6953c6e8e04"),    // Person with locs
  u("1600950207944-0d63e8edbc3f"),    // Loc styling
  u("1519699047748-de8e457a634e"),    // Natural hair portrait
  u("1494790108377-be9c29b29330"),    // Person portrait locs
];

const LOCS_GALLERY = [
  u("1579187707643-35646d22b596"),    // Loc retwist session
  u("1526047932273-341f2a7631f9"),    // Hair care products
  u("1596178065887-1198b6148b2b"),    // Hair styling
  u("1560869713-7d0a29430803"),      // Salon chair
  u("1634449571010-02389ed0f9b0"),    // Salon space
  u("1516975080664-ed2fc6a32937"),    // Styling tools
  u("1522337360788-8b13dee7a37e"),    // Salon setup
  u("1600950207944-0d63e8edbc3f"),    // Loc maintenance
  u("1580618672591-eb180b1a973f"),    // Hair care
  u("1527799820374-dcf8d9d4a388"),    // Products display
];

// Natural hair & silk press — twist-outs, afros, blowouts
const NATURAL_COVERS = [
  u("1524504388940-b1c1722653e1"),    // Natural hair portrait
  u("1560066984-138dadb4c035"),      // Afro beauty
  u("1487412720507-e7ab37603c6f"),    // Natural texture
  u("1493256338651-d82f7acb2b38"),    // Curly hair
  u("1617137968427-85924c800a22"),    // Natural hair styling
  u("1531746020798-e6953c6e8e04"),    // Textured hair close-up
];

const NATURAL_GALLERY = [
  u("1522337360788-8b13dee7a37e"),    // Styling session
  u("1526047932273-341f2a7631f9"),    // Hair products
  u("1580618672591-eb180b1a973f"),    // Salon work
  u("1605497788044-5a32c7078486"),    // Styling in progress
  u("1634449571010-02389ed0f9b0"),    // Salon interior
  u("1516975080664-ed2fc6a32937"),    // Tools and products
  u("1527799820374-dcf8d9d4a388"),    // Product shelf
  u("1596178065887-1198b6148b2b"),    // Hair styling
  u("1560869713-7d0a29430803"),      // Salon station
  u("1562004760-aceed7bb0fe3"),      // Hair close-up
];

// Weaves & extensions — sew-ins, closures, wigs
const WEAVES_COVERS = [
  u("1519699047748-de8e457a634e"),    // Glamorous hair portrait
  u("1493256338651-d82f7acb2b38"),    // Flowing hair
  u("1580618672591-eb180b1a973f"),    // Hair install session
  u("1562004760-aceed7bb0fe3"),      // Long hair style
  u("1560066984-138dadb4c035"),      // Hair beauty
  u("1596178065887-1198b6148b2b"),    // Sew-in styling
];

const WEAVES_GALLERY = [
  u("1605497788044-5a32c7078486"),    // Styling in progress
  u("1634449571010-02389ed0f9b0"),    // Salon interior
  u("1522337360788-8b13dee7a37e"),    // Salon setup
  u("1516975080664-ed2fc6a32937"),    // Hair tools
  u("1527799820374-dcf8d9d4a388"),    // Extension products
  u("1526047932273-341f2a7631f9"),    // Hair care
  u("1560869713-7d0a29430803"),      // Station setup
  u("1580489944761-15a19d654956"),    // Hair result
  u("1524504388940-b1c1722653e1"),    // Hair portrait
  u("1595515106969-1ce29566ff1c"),    // Finished style
];

// Barbering & cuts — fades, lineups, tapers
const BARBER_COVERS = [
  u("1503951914875-452162b0f3f1"),    // Barber cutting hair
  u("1599351431202-1e0f0137899a"),    // Barbershop scene
  u("1621605815971-fbc98d665033"),    // Fresh fade
  u("1612010167108-3e6b327405f0"),    // Barber at work
  u("1534528741775-53994a69daeb"),    // Clean lineup
  u("1507003211169-0a1dd7228f2d"),    // Man fresh haircut
];

const BARBER_GALLERY = [
  u("1534528741775-53994a69daeb"),    // Barber tools
  u("1599351431202-1e0f0137899a"),    // Shop interior
  u("1503951914875-452162b0f3f1"),    // Cutting session
  u("1526047932273-341f2a7631f9"),    // Grooming products
  u("1612010167108-3e6b327405f0"),    // Barbering
  u("1634449571010-02389ed0f9b0"),    // Shop space
  u("1516975080664-ed2fc6a32937"),    // Clippers and tools
  u("1560869713-7d0a29430803"),      // Barber station
  u("1621605815971-fbc98d665033"),    // Fade close-up
  u("1507003211169-0a1dd7228f2d"),    // Finished cut
];

// Color — highlights, blonde, custom color
const COLOR_COVERS = [
  u("1519699047748-de8e457a634e"),    // Colored hair portrait
  u("1560066984-138dadb4c035"),      // Bold color
  u("1493256338651-d82f7acb2b38"),    // Colored style
  u("1524504388940-b1c1722653e1"),    // Hair color result
  u("1580618672591-eb180b1a973f"),    // Color session
  u("1596178065887-1198b6148b2b"),    // Color work
];

const COLOR_GALLERY = [
  u("1605497788044-5a32c7078486"),    // Color process
  u("1634449571010-02389ed0f9b0"),    // Salon
  u("1522337360788-8b13dee7a37e"),    // Color station
  u("1516975080664-ed2fc6a32937"),    // Color tools/bowls
  u("1527799820374-dcf8d9d4a388"),    // Color products
  u("1526047932273-341f2a7631f9"),    // Hair care products
  u("1560869713-7d0a29430803"),      // Salon station
  u("1562004760-aceed7bb0fe3"),      // Color result
  u("1580489944761-15a19d654956"),    // Styled result
  u("1595515106969-1ce29566ff1c"),    // Color close-up
];

// ── Image pools by category slug ────────────────────────────────────

const POOLS: Record<string, { covers: string[]; gallery: string[] }> = {
  "braids-protective": { covers: BRAIDS_COVERS, gallery: BRAIDS_GALLERY },
  "locs":              { covers: LOCS_COVERS,   gallery: LOCS_GALLERY },
  "natural-silk-press":{ covers: NATURAL_COVERS, gallery: NATURAL_GALLERY },
  "weaves-extensions": { covers: WEAVES_COVERS, gallery: WEAVES_GALLERY },
  "barbering-cuts":    { covers: BARBER_COVERS, gallery: BARBER_GALLERY },
  "color":             { covers: COLOR_COVERS,  gallery: COLOR_GALLERY },
};

// Default pool (mix of everything)
const DEFAULT_POOL = {
  covers: [...BRAIDS_COVERS, ...LOCS_COVERS, ...NATURAL_COVERS],
  gallery: [...BRAIDS_GALLERY, ...LOCS_GALLERY, ...NATURAL_GALLERY],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Updating business listing images...\n");

  // Get categories
  const { data: cats } = await supabase
    .from("service_categories")
    .select("id, slug");
  const catSlugById = Object.fromEntries(
    (cats ?? []).map((c) => [c.id, c.slug]),
  );

  // Get all businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, primary_category_id")
    .eq("is_published", true)
    .eq("verification_status", "verified");

  if (!businesses?.length) {
    console.log("No businesses found.");
    return;
  }

  let updated = 0;
  for (const biz of businesses) {
    const catSlug = biz.primary_category_id
      ? catSlugById[biz.primary_category_id]
      : null;
    const pool = (catSlug && POOLS[catSlug]) ? POOLS[catSlug] : DEFAULT_POOL;

    const cover = pick(pool.covers);
    const gallery = pickN(pool.gallery, 4);

    const { error } = await supabase
      .from("businesses")
      .update({
        cover_url: cover,
        gallery: gallery,
      })
      .eq("id", biz.id);

    if (error) {
      console.error(`  ${biz.name}: ${error.message}`);
    } else {
      updated++;
    }
  }

  console.log(`  Updated ${updated}/${businesses.length} businesses.`);

  // Also update the demo business specifically
  const { data: demo } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", "crown-and-glory-braids")
    .maybeSingle();

  if (demo) {
    await supabase
      .from("businesses")
      .update({
        cover_url: BRAIDS_COVERS[0],
        gallery: pickN(BRAIDS_GALLERY, 4),
      })
      .eq("id", demo.id);
    console.log("  Demo business (Crown & Glory) given braids-specific images.");
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
