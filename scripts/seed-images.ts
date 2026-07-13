/**
 * Seed cover_url and gallery images for all businesses.
 * Uses Unsplash images relevant to each category.
 * Run: npx tsx scripts/seed-images.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Category IDs from the database
const CATEGORIES: Record<string, string> = {
  braids: "b1b73e49-ef67-45eb-8dfe-d616525aa8b2",
  locs: "5e7cd0e1-1904-4e6e-aded-f10e71bf5ac0",
  natural: "f9a0910e-d64b-444c-9f26-8e51b5c9807b",
  weaves: "67bd7f2c-ac06-4589-80d6-a9825828ae96",
  barber: "be9c9f58-c06a-4f88-91d2-a4a9a2aa99a6",
  color: "d2956422-0124-42ca-b73e-009ad635aec2",
};

const CAT_ID_TO_KEY: Record<string, string> = {};
for (const [k, v] of Object.entries(CATEGORIES)) CAT_ID_TO_KEY[v] = k;

// Unsplash images per category — high quality, relevant to textured hair / salon / barber
// Using direct Unsplash image URLs with size parameters
const categoryImages: Record<string, string[]> = {
  braids: [
    "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800&q=80",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80",
    "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=800&q=80",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80",
    "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&q=80",
    "https://images.unsplash.com/photo-1549236177-f9b0031756eb?w=800&q=80",
    "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&q=80",
    "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80",
  ],
  locs: [
    "https://images.unsplash.com/photo-1611095564985-f8c5cd2eb600?w=800&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    "https://images.unsplash.com/photo-1579187707643-35646d22b596?w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    "https://images.unsplash.com/photo-1536766768598-e09213fdcf22?w=800&q=80",
    "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=800&q=80",
    "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=800&q=80",
  ],
  natural: [
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&q=80",
    "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=800&q=80",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
    "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=800&q=80",
    "https://images.unsplash.com/photo-1549236177-f9b0031756eb?w=800&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80",
    "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&q=80",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80",
  ],
  weaves: [
    "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=800&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80",
    "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&q=80",
    "https://images.unsplash.com/photo-1549236177-f9b0031756eb?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&q=80",
    "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800&q=80",
    "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&q=80",
  ],
  barber: [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    "https://images.unsplash.com/photo-1585747860036-4cb4e1ef181b?w=800&q=80",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
    "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800&q=80",
    "https://images.unsplash.com/photo-1587776903813-623049b3527e?w=800&q=80",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80",
    "https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=800&q=80",
    "https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=800&q=80",
  ],
  color: [
    "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80",
    "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=800&q=80",
    "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=800&q=80",
    "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800&q=80",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
    "https://images.unsplash.com/photo-1549236177-f9b0031756eb?w=800&q=80",
    "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80",
  ],
};

// Generic salon/beauty images for businesses without a category
const genericImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
  "https://images.unsplash.com/photo-1521590832167-7228fcb882c4?w=800&q=80",
  "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80",
  "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=800&q=80",
  "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80",
  "https://images.unsplash.com/photo-1549236177-f9b0031756eb?w=800&q=80",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const { data: businesses } = await s
    .from("businesses")
    .select("id, name, primary_category_id, cover_url, gallery")
    .order("created_at");

  let updated = 0;
  for (const biz of businesses ?? []) {
    const catKey = CAT_ID_TO_KEY[biz.primary_category_id ?? ""] ?? null;
    const images = shuffle(
      catKey ? categoryImages[catKey] : genericImages,
    );

    // Pick cover (first image) and 3-4 gallery images (rest)
    const cover = images[0];
    const gallery = images.slice(1, 5);

    const { error } = await s
      .from("businesses")
      .update({ cover_url: cover, gallery })
      .eq("id", biz.id);

    if (error) {
      console.error(`  FAIL: ${biz.name}:`, error.message);
    } else {
      updated++;
    }
  }

  console.log(`Done! Updated ${updated} businesses with cover + gallery images.`);

  // Verify
  const { count: withCover } = await s
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .not("cover_url", "is", null);
  const { count: total } = await s
    .from("businesses")
    .select("id", { count: "exact", head: true });
  console.log(`Businesses with cover: ${withCover}/${total}`);
}

main();
