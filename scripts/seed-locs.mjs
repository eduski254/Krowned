import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_USER_ID = '1538c561-a0fb-4a30-bc6d-1e75fd00a0c7';
const FREE_PLAN_ID = '30e18365-22d1-4416-ac9d-b71c2aa38680';
const IMAGES_DIR = join(process.cwd(), 'images', 'images');

const CITY_COORDS = {
  'Washington': { lat: 38.9072, lng: -77.0369 },
  'Silver Spring': { lat: 38.9907, lng: -77.0261 },
  'Mt Rainier': { lat: 38.9418, lng: -76.9647 },
  'Temple Hills': { lat: 38.8140, lng: -76.9455 },
  'Capitol Heights': { lat: 38.8854, lng: -76.9158 },
  'Woodbridge': { lat: 38.6582, lng: -77.2497 },
  'Bowie': { lat: 38.9429, lng: -76.7303 },
  'Lanham': { lat: 38.9690, lng: -76.8614 },
  'Hyattsville': { lat: 38.9559, lng: -76.9455 },
  'College Park': { lat: 38.9807, lng: -76.9369 },
  'Waldorf': { lat: 38.6246, lng: -76.9391 },
  'Oxon Hill': { lat: 38.8034, lng: -76.9897 },
  'Clinton': { lat: 38.7651, lng: -76.8984 },
  'Upper Marlboro': { lat: 38.8157, lng: -76.7497 },
  'Suitland': { lat: 38.8487, lng: -76.9236 },
  'Hillcrest Heights': { lat: 38.8340, lng: -76.9597 },
  'District Heights': { lat: 38.8576, lng: -76.9394 },
  'Largo': { lat: 38.8976, lng: -76.8294 },
  'Crofton': { lat: 39.0018, lng: -76.6874 },
  'Landover Hills': { lat: 38.9432, lng: -76.8919 },
  'Laurel': { lat: 39.0993, lng: -76.8483 },
  'Greenbelt': { lat: 38.9954, lng: -76.8827 },
};

const businesses = [
  { name: "Loc Lov", address: "1242 Pennsylvania Ave. SE 2nd Floor, Washington, DC 20003", phone: "(202) 677-9065", website: "loclov.com", coverImage: "locs-01-loc-lov.jpg" },
  { name: "LocJoy Inc", address: "8241 Georgia Ave Ste. 107, Silver Spring, MD 20910", phone: "(240) 470-3250", website: "locjoy.style", coverImage: "locs-02-locjoy-inc.jpg" },
  { name: "The Loc Shop", address: "3815 34th St, Mt Rainier, MD 20712", phone: "(301) 853-7323", website: "the-locshop.com", coverImage: "locs-03-the-loc-shop.jpg" },
  { name: "Locs To Lashes Salon & Spa", address: "4700 Stamp Rd Ste G1, Temple Hills, MD 20748", phone: "(301) 423-8060", website: "locstolashes.com", coverImage: "locs-04-locs-to-lashes-salon-and-spa.jpg" },
  { name: "INSPIRATION LOCS-N-CUTZ", address: "702 Ritchie Rd, Capitol Heights, MD 20743", phone: "(301) 456-1982", website: "locsncutz.com", coverImage: "locs-05-inspiration-locs-n-cutz.jpg" },
  { name: "Creative Loc's", address: "1133 B East-West Hwy #13, Silver Spring, MD 20910", phone: "(757) 602-0117", website: "creativelocs.glossgenius.com", coverImage: "locs-06-creative-locs.jpg" },
  { name: "Flourishing Locs, L.L.C.", address: "4410 Stamp Rd, Temple Hills, MD 20748", phone: "", website: "flourishinglocsllc.as.me", coverImage: "locs-07-flourishing-locs.jpg" },
  { name: "Loc Kween Studios", address: "2542 Prince William Pkwy Unit 120 Studio 22, Woodbridge, VA 22192", phone: "(703) 300-0091", website: "glossgenius.com", coverImage: "locs-08-loc-kween-studios.jpg" },
  { name: "Fabulocs Natural Hair Salon and Products", address: "3032 Mitchellville Rd #202, Bowie, MD 20716", phone: "(240) 463-3617", website: "fabulocs.com", coverImage: "locs-09-fabulocs-natural-hair-salon.jpg" },
  { name: "Lord of Locs", address: "9201 Cooks Point Ct, Lanham, MD 20706", phone: "(240) 524-6498", website: "lord-of-locs.zoca.ai", coverImage: "locs-10-lord-of-locs.jpg" },
  { name: "Loud N Knotty", address: "2970 Belcrest Center Dr Suite 202, Hyattsville, MD 20782", phone: "", website: "loudnknotty.com", coverImage: "locs-11-loud-n-knotty.jpg" },
  { name: "Beauty By Chynaa LLC", address: "10250 Baltimore Ave Ste 110, College Park, MD 20740", phone: "(301) 547-5266", website: "beautybychynaa.square.site", coverImage: "locs-12-beauty-by-chynaa.jpg" },
  { name: "Locs N Beyond", address: "13833 Outlet Dr Ste 113, Silver Spring, MD 20904", phone: "(301) 828-6925", website: "", coverImage: "locs-13-locs-n-beyond.jpg" },
  { name: "The Loc Genius", address: "7404 Executive Pl, Lanham, MD 20706", phone: "(571) 642-4474", website: "thelocgenius.com", coverImage: "locs-14-the-loc-genius.jpg" },
  { name: "SaHel Locs", address: "14502 Greenview Dr Ste 533, Laurel, MD 20708", phone: "(240) 486-4734", website: "sahellocs.com", coverImage: "locs-15-sahel-locs.jpg" },
  { name: "Maggie's Touch Braids & Locs", address: "6718 Flagstaff St, Hyattsville, MD 20785", phone: "(240) 714-2122", website: "maggies-touch.chrone.work", coverImage: "locs-16-maggies-touch-braids-and-locs.jpg" },
  { name: "Luv & Locs Natural Hair Care Salon", address: "7578 Annapolis Rd Ste #12, Hyattsville, MD 20784", phone: "(202) 497-6480", website: "luvnlocssalon.glossgenius.com", coverImage: "locs-17-luv-and-locs-natural-hair-care-salon.jpg" },
  { name: "Cynthia's Natural Locs & More", address: "11222 Grandview Ave, Silver Spring, MD 20902", phone: "(301) 232-8611", website: "dreadlocksinsilverspringsmd.com", coverImage: "locs-18-cynthias-natural-locs-and-more.jpg" },
  { name: "Imperiallocs", address: "7319 Hanover Pkwy C, Greenbelt, MD 20770", phone: "(202) 539-5004", website: "imperiallocks.net", coverImage: "locs-19-imperiallocs.jpg" },
  { name: "ADUNNI'S BRAIDS & LOCS", address: "9470 Annapolis Rd #312, Lanham, MD 20706", phone: "(240) 521-7746", website: "adunnisbraids.com", coverImage: "locs-20-adunnis-braids-and-locs.jpg" },
  { name: "Kinky Locs by RaShaun", address: "3290 Crain Hwy #22, Waldorf, MD 20603", phone: "(301) 806-5141", website: "", coverImage: "locs-21-kinky-locs-by-rashaun.jpg" },
  { name: "So Rare Locs", address: "3027 Festival Way, Waldorf, MD 20603", phone: "", website: "sorarelocs.square.site", coverImage: "locs-22-so-rare-locs.jpg" },
  { name: "Loc'd In by Jakeera", address: "3290 Crain Hwy Suite 8, Waldorf, MD 20603", phone: "(202) 599-7592", website: "glossgenius.com", coverImage: "locs-23-locd-in-by-jakeera.jpg" },
  { name: "NJA_Locsbytae", address: "3200 Crain Hwy Ste 200-1, Waldorf, MD 20603", phone: "(240) 392-7313", website: "", coverImage: "locs-24-nja-locsbytae.jpg" },
  { name: "Deja vu Honey locs", address: "21 Industrial Park Dr, Waldorf, MD 20602", phone: "(240) 448-8226", website: "dejavuhoneylocs.booksy.com", coverImage: "locs-25-deja-vu-honey-locs.jpg" },
  { name: "Naturalcentric Hair Salon", address: "1540 Pointer Ridge Pl Ste B, Bowie, MD 20716", phone: "", website: "naturalcentric.com", coverImage: "locs-26-naturalcentric-hair-salon.jpg" },
  { name: "Natural Hair & Locking Center", address: "1142 Kennebec St, Oxon Hill, MD 20745", phone: "(240) 486-0740", website: "theenaturalhaircenter.com", coverImage: "locs-27-natural-hair-and-locking-center.jpg" },
  { name: "ReneeLocGoddess LLC", address: "4526 Beech Rd Ste 2, Temple Hills, MD 20748", phone: "(301) 549-2139", website: "", coverImage: "locs-28-renee-loc-goddess.jpg" },
  { name: "Sisterlocks Microlocks-Locs Salon", address: "4562 Laurel Rd, Temple Hills, MD 20748", phone: "(301) 423-1799", website: "", coverImage: "locs-29-sisterlocks-microlocks-suds-n-skin.jpg" },
  { name: "Dmv Faux Locs Salon", address: "5627 Allentown Rd #107, Suitland, MD 20746", phone: "(240) 639-2447", website: "booksy.com", coverImage: "locs-30-dmv-faux-locs-salon.jpg" },
  { name: "Locs Like Roses", address: "5679 Suitland Rd, Hillcrest Heights, MD 20746", phone: "(202) 681-4470", website: "sibretterose.glossgenius.com", coverImage: "locs-31-locs-like-roses.jpg" },
  { name: "Locss By Tip", address: "5614 Silver Hill Rd Ste 140, District Heights, MD 20747", phone: "(202) 271-5962", website: "", coverImage: "locs-32-locss-by-tip.jpg" },
  { name: "Sassi Beauty & Loc Salon", address: "39 Yost Pl, Capitol Heights, MD 20743", phone: "(301) 499-7200", website: "", coverImage: "locs-33-sassi-beauty-and-loc-salon.jpg" },
  { name: "locXurious natural hair salon", address: "8765 Branch Ave, Clinton, MD 20735", phone: "(202) 491-0395", website: "locxurious.com", coverImage: "locs-34-locxurious-natural-hair-salon.jpg" },
  { name: "Thee Kee 2ur locs", address: "14601 Main St, Upper Marlboro, MD 20772", phone: "(202) 556-4974", website: "theekee2urlocs.glossgenius.com", coverImage: "locs-35-thee-kee-2ur-locs.jpg" },
  { name: "Locd With Tootie", address: "14454 Old Mill Rd, Upper Marlboro, MD 20772", phone: "(202) 556-1811", website: "locdwithtootie.glossgenius.com", coverImage: "locs-36-locd-with-tootie.jpg" },
  { name: "The Loc'd Barb-Her", address: "9540 Marlboro Pike, Upper Marlboro, MD 20772", phone: "(202) 907-5690", website: "thelocdbarbher.booksy.com", coverImage: "locs-37-the-locd-barb-her.jpg" },
  { name: "Loc Studio & Lounge", address: "10565 Greenbelt Rd, Lanham, MD 20706", phone: "(202) 480-9722", website: "", coverImage: "locs-38-loc-studio-and-lounge.jpg" },
  { name: "DIANA BRAIDS & LOCS", address: "4500 Forbes Blvd Ste 400 Room L6, Lanham, MD 20706", phone: "", website: "dianabraidandlocs.com", coverImage: "locs-39-diana-braids-and-locs.jpg" },
  { name: "Locs By Sunshine", address: "501 Harry S Truman Dr, Largo, MD 20774", phone: "(301) 254-5383", website: "sites.google.com", coverImage: "locs-40-locs-by-sunshine.jpg" },
  { name: "RADIANT LOCS, LOOKS AND LIFE", address: "12509 Dillingham Square, Woodbridge, VA 22192", phone: "(214) 274-9160", website: "calendly.com", coverImage: "locs-41-radiant-locs-looks-and-life.jpg" },
  { name: "Loc'd Up", address: "14304 Smoketown Rd Suite 9, Woodbridge, VA 22192", phone: "(833) 810-6702", website: "locd-up-va.square.site", coverImage: "locs-42-locd-up.jpg" },
  { name: "Gifted Locs", address: "13895 Hedgewood Dr, Woodbridge, VA 22193", phone: "(703) 357-8827", website: "giftedlocsva.com", coverImage: "locs-43-gifted-locs.jpg" },
  { name: "True hair love salon", address: "4217 Dale Blvd, Woodbridge, VA 22193", phone: "(571) 527-6203", website: "braidsandstylesbyugo.com", coverImage: "locs-44-true-hair-love-salon.jpg" },
  { name: "Lavish Locs", address: "3841 Evergreen Pkwy, Bowie, MD 20716", phone: "(202) 770-5149", website: "lavishhlocss.glossgenius.com", coverImage: "locs-45-lavish-locs.jpg" },
  { name: "Grace's Hair Braiding and Locs Salon", address: "1641 MD-3, Crofton, MD 21114", phone: "(240) 491-6459", website: "link.booksy.com", coverImage: "locs-46-graces-hair-braiding-and-locs.jpg" },
  { name: "Everyday Hair - Loc Extensions", address: "6315 Seabrook Rd Ste 204B, Lanham, MD 20706", phone: "(227) 268-5832", website: "everydayhair.glossgenius.com", coverImage: "locs-47-everyday-hair-loc-extensions.jpg" },
  { name: "LN LocCraftStudio", address: "7505 Buchanan St, Landover Hills, MD 20784", phone: "(240) 606-5699", website: "", coverImage: "locs-48-ln-loccraftstudio.jpg" },
  { name: "Natural Beauty Lounge", address: "19 C St, Laurel, MD 20707", phone: "(240) 547-9958", website: "naturalbeautylounge.zoca.com", coverImage: "locs-49-natural-beauty-lounge.jpg" },
  { name: "The King of Crochet", address: "6504 America Blvd, Hyattsville, MD 20782", phone: "(202) 681-4808", website: "thecrochetking.com", coverImage: "locs-50-the-king-of-crochet.jpg" },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function parseCity(address) {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) return parts[parts.length - 2];
  if (parts.length === 2) return parts[0];
  return null;
}

function getCoords(address, city) {
  for (const [name, c] of Object.entries(CITY_COORDS)) {
    if ((city && city.includes(name)) || address.includes(name)) {
      return {
        lat: c.lat + (Math.random() - 0.5) * 0.01,
        lng: c.lng + (Math.random() - 0.5) * 0.01,
      };
    }
  }
  // Default DC
  return {
    lat: 38.9072 + (Math.random() - 0.5) * 0.01,
    lng: -77.0369 + (Math.random() - 0.5) * 0.01,
  };
}

console.log('Seeding 50 locs businesses...\n');

let seeded = 0;
let imgUploaded = 0;

for (const biz of businesses) {
  const city = parseCity(biz.address);
  const slug = slugify(biz.name);
  const coords = getCoords(biz.address, city);

  // Check slug uniqueness
  const { data: existing } = await sb.from('businesses').select('slug').eq('slug', slug);
  const finalSlug = existing && existing.length > 0 ? `${slug}-locs` : slug;

  // Upload cover image
  let coverUrl = null;
  const imgPath = join(IMAGES_DIR, biz.coverImage);
  if (existsSync(imgPath)) {
    try {
      const imgBuffer = readFileSync(imgPath);
      const storagePath = `covers/${finalSlug}.jpg`;
      const { error: uploadErr } = await sb.storage
        .from('business-images')
        .upload(storagePath, imgBuffer, { contentType: 'image/jpeg', upsert: true });
      if (!uploadErr) {
        const { data: urlData } = sb.storage.from('business-images').getPublicUrl(storagePath);
        coverUrl = urlData.publicUrl;
        imgUploaded++;
      } else {
        console.log(`  IMG skip ${biz.coverImage}: ${uploadErr.message}`);
      }
    } catch (e) {
      console.log(`  IMG error ${biz.coverImage}: ${e.message}`);
    }
  } else {
    console.log(`  IMG missing: ${biz.coverImage}`);
  }

  const website = biz.website && biz.website.length > 0
    ? (biz.website.startsWith('http') ? biz.website : `https://${biz.website}`)
    : null;

  const { error: insertErr } = await sb.from('businesses').insert({
    name: biz.name,
    slug: finalSlug,
    owner_id: KEEP_USER_ID,
    plan_id: FREE_PLAN_ID,
    address: biz.address,
    phone: biz.phone || null,
    email: null,
    city: city,
    country: 'US',
    cover_url: coverUrl,
    description: `${biz.name} is a locs specialist salon in the DMV area.`,
    is_published: true,
    verification_status: 'verified',
    claimed: false,
    timezone: 'America/New_York',
    latitude: coords.lat,
    longitude: coords.lng,
    social_links: website ? { website } : null,
  });

  if (insertErr) {
    console.error(`  FAIL ${biz.name}: ${insertErr.message}`);
  } else {
    seeded++;
    process.stdout.write(`  [${seeded}/50] ${biz.name}\n`);
  }
}

console.log(`\nDone! Seeded ${seeded} businesses, uploaded ${imgUploaded} images.`);
