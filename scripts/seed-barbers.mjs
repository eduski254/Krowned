import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_USER_ID = '1538c561-a0fb-4a30-bc6d-1e75fd00a0c7';
const FREE_PLAN_ID = '30e18365-22d1-4416-ac9d-b71c2aa38680';
const IMAGES_DIR = join(process.cwd(), 'images', 'images');

// Build lookup of actual barbershop image files by number prefix
const allFiles = readdirSync(IMAGES_DIR).filter(f => f.startsWith('barbershop-'));
const filesByNum = {};
for (const f of allFiles) {
  const num = f.split('-')[1]; // e.g. "01"
  if (!filesByNum[num]) filesByNum[num] = [];
  filesByNum[num].push(f);
}

const CITY_COORDS = {
  'Washington': { lat: 38.9072, lng: -77.0369 },
  'Arlington': { lat: 38.8799, lng: -77.1068 },
};

const businesses = [
  { name: "Signature Cuts and Shaves", address: "1019 U St NW, Washington, DC 20001", phone: "(202) 280-7650", website: "signaturecutsandshaves.com", coverImage: "barbershop-01-signature-cuts-and-shaves.jpg" },
  { name: "Scissors & Scotch", address: "331 N St NE, Washington, DC 20002", phone: "(202) 481-2850", website: "scissorsscotch.com", coverImage: "barbershop-02-scissors-scotch.jpg" },
  { name: "Barber of Hell's Bottom", address: "818 Rhode Island Ave NW, Washington, DC 20001", phone: "(202) 332-0200", website: "barberofhellsbottom.com", coverImage: "barbershop-03-barber-of-hell-s-bottom.jpg" },
  { name: "Lady Clipper Barber Shop", address: "1514 U St NW, Washington, DC 20009", phone: "(202) 368-4603", website: "theladyclipper.com", coverImage: "barbershop-04-lady-clipper-barber-shop.jpg" },
  { name: "Bearded Goat Barber", address: "297 Tingey St SE Suite 101, Washington, DC 20003", phone: "(202) 688-8177", website: "beardedgoatbarber.com", coverImage: "barbershop-05-bearded-goat-barber.jpg" },
  { name: "DC Classic Cuts Barbershop", address: "1615 17th St NW Floor 2, Washington, DC 20009", phone: "(703) 877-9000", website: "square.site", coverImage: "barbershop-06-dc-classic-cuts-barbershop.jpg" },
  { name: "JAJO'S Barber Shop", address: "404 8th St SE, Washington, DC 20003", phone: "(202) 795-9889", website: "", coverImage: "barbershop-07-jajo-s-barber-shop.jpg" },
  { name: "DC Barber And Spa", address: "201 Massachusetts Ave NE, Washington, DC 20002", phone: "(202) 804-4364", website: "dcbarberandspa.com", coverImage: "barbershop-08-dc-barber-and-spa.jpg" },
  { name: "Capitol Barber & Stylist", address: "201 Massachusetts Ave NE, Washington, DC 20002", phone: "(202) 544-8380", website: "capitolbarberstylist.com", coverImage: "barbershop-09-capitol-barber-stylist.jpg" },
  { name: "Lee's Barbershop", address: "4409 Bowen Rd SE, Washington, DC 20019", phone: "(202) 575-5110", website: "leesbarbershopdc.com", coverImage: "barbershop-10-lee-s-barbershop.jpg" },
  { name: "Henry Barbershop", address: "1924 I St NW, Washington, DC 20006", phone: "(202) 808-1008", website: "henrybarber.shop", coverImage: "barbershop-11-henry-barbershop.jpg" },
  { name: "Cut N Edge Family Barbershop", address: "4481 Connecticut Ave NW, Washington, DC 20008", phone: "(202) 537-1530", website: "cutnedgebarbershop.com", coverImage: "barbershop-12-cut-n-edge-family-barbershop.jpg" },
  { name: "World Class Cuts", address: "460 K St NW, Washington, DC 20001", phone: "(202) 682-0555", website: "worldclasscutsdc.com", coverImage: "barbershop-13-world-class-cuts.jpg" },
  { name: "Faded With Finessse", address: "1615 17th St NW, Washington, DC 20009", phone: "", website: "squareup.com", coverImage: "barbershop-14-faded-with-finessse.jpg" },
  { name: "Watergate Cuts", address: "2536 Virginia Ave NW, Washington, DC 20037", phone: "(202) 333-0145", website: "", coverImage: "barbershop-15-watergate-cuts.jpg" },
  { name: "Best Cut Barber Shop", address: "2612 Georgia Ave NW, Washington, DC 20001", phone: "(202) 238-9598", website: "bestcutsdc.com", coverImage: "barbershop-16-best-cut-barber-shop.jpg" },
  { name: "Metro Barber Shop", address: "955 D St SW, Washington, DC 20024", phone: "(202) 554-2891", website: "hair2cut.com", coverImage: "barbershop-17-metro-barber-shop.jpg" },
  { name: "Sir Bespoke | Luxury Barbershop & Grooming Lounge", address: "1102 H St NE, Washington, DC 20002", phone: "", website: "sirbespoke.com", coverImage: "barbershop-18-sir-bespoke.jpg" },
  { name: "Diane's Barber Shop", address: "3921 Windom Pl NW, Washington, DC 20016", phone: "(202) 966-7994", website: "dianesbarbershop.com", coverImage: "barbershop-19-diane-s-barber-shop.jpg" },
  { name: "Lewis Barbershop", address: "5503 Colorado Ave NW, Washington, DC 20011", phone: "(202) 722-2992", website: "", coverImage: "barbershop-20-lewis-barbershop.jpg" },
  { name: "Mohamed's Barber Shop", address: "3310 Georgia Ave NW, Washington, DC 20010", phone: "(202) 882-1125", website: "", coverImage: "barbershop-21-mohamed-s-barber-shop.jpg" },
  { name: "Community Barber Shop", address: "1931 North Capitol St NE, Washington, DC 20002", phone: "(202) 635-9869", website: "", coverImage: "barbershop-22-community-barber-shop.jpg" },
  { name: "Bold Blade Barbershop", address: "2836 Wilson Blvd, Arlington, VA 22201", phone: "(703) 512-2003", website: "boldbladebarber.com", coverImage: "barbershop-23-bold-blade-barbershop.jpg" },
  { name: "Supreme Barbershop", address: "1755 Clarendon Blvd, Arlington, VA 22209", phone: "(703) 522-8888", website: "supremebarbershoparlington.com", coverImage: "barbershop-24-supreme-barbershop.jpg" },
  { name: "Arlington Barber Shop", address: "1001 N Fillmore St C, Arlington, VA 22201", phone: "(703) 243-7545", website: "", coverImage: "barbershop-25-arlington-barber-shop.jpg" },
  { name: "The Premium Barber Shop", address: "1747 Clarendon Blvd, Arlington, VA 22209", phone: "(571) 257-5503", website: "thepremiumbarbershop.com", coverImage: "barbershop-26-the-premium-barber-shop.jpg" },
  { name: "Ballston Barber Shop", address: "901 N Pollard St #2, Arlington, VA 22203", phone: "(703) 243-5542", website: "zenmaxi.click", coverImage: "barbershop-27-ballston-barber-shop.jpg" },
  { name: "Casablanca Barber House", address: "900 N Taylor St, Arlington, VA 22203", phone: "(571) 663-9920", website: "casablancabarbers.com", coverImage: "barbershop-28-casablanca-barber-house.jpg" },
  { name: "Misfit Barber", address: "2111 Richmond Hwy, Arlington, VA 22202", phone: "(703) 362-9862", website: "styleseat.com", coverImage: "barbershop-29-misfit-barber.jpg" },
  { name: "Crystal City Cuts", address: "529 23rd St S, Arlington, VA 22202", phone: "(703) 992-3558", website: "ccsportspub.com", coverImage: "barbershop-30-crystal-city-cuts.jpg" },
  { name: "Roosters Men's Grooming Center", address: "554 12th St S, Arlington, VA 22202", phone: "(571) 312-5408", website: "roostersmgc.com", coverImage: "barbershop-31-roosters-men-s-grooming-center.jpg" },
  { name: "Scissors & Blade Barber", address: "560 23rd St S, Arlington, VA 22202", phone: "(202) 230-0120", website: "scissorsblade.square.site", coverImage: "barbershop-32-scissors-blade-barber.jpg" },
  { name: "Royal Barbershop", address: "1560 Wilson Blvd Ste 150, Arlington, VA 22209", phone: "(703) 887-4330", website: "royalbarbershopandsalon.com", coverImage: "barbershop-33-royal-barbershop.jpg" },
  { name: "TL Barbershop", address: "1800 Wilson Blvd Unit 130, Arlington, VA 22201", phone: "(703) 243-6878", website: "tlbarbershop.com", coverImage: "barbershop-34-tl-barbershop.jpg" },
  { name: "Riverplace Barber and Stylist", address: "1113 Arlington Blvd, Arlington, VA 22209", phone: "(703) 567-1191", website: "", coverImage: "barbershop-35-riverplace-barber-and-stylist.jpg" },
  { name: "BarberArlington", address: "3107 10th St N Unit 0, Arlington, VA 22201", phone: "(703) 640-4366", website: "anisthebarber.schedulista.com", coverImage: "barbershop-36-barberarlington.jpg" },
  { name: "Willy & Habib's Barber Shop", address: "3107 10th St N, Arlington, VA 22201", phone: "(703) 527-1424", website: "", coverImage: "barbershop-37-willy-habib-s-barber-shop.jpg" },
  { name: "Lee Barber Shop", address: "5177 US-29, Arlington, VA 22207", phone: "(703) 533-0454", website: "leebarbershop.com", coverImage: "barbershop-38-lee-barber-shop.jpg" },
  { name: "Barber Super Mario", address: "2718 Washington Blvd, Arlington, VA 22201", phone: "(571) 320-6362", website: "barbersupermario.com", coverImage: "barbershop-39-barber-super-mario.jpg" },
  { name: "Clarendon Barber & Hairstylist LLC", address: "1407 N Garfield St, Arlington, VA 22201", phone: "(703) 527-5588", website: "clarendonhairshop.com", coverImage: "barbershop-40-clarendon-barber-hairstylist-llc.jpg" },
  { name: "Inspire Barbershop", address: "710 N Glebe Rd, Arlington, VA 22203", phone: "(703) 248-8888", website: "inspirebarbershop.com", coverImage: "barbershop-41-inspire-barbershop.jpg" },
  { name: "Mane Haven Barber Spa", address: "3001 Washington Blvd Ste 9, Arlington, VA 22201", phone: "", website: "book.squareup.com", coverImage: "barbershop-42-mane-haven-barber-spa.jpg" },
  { name: "J.A. Barbershop LLC", address: "1010 N Glebe Rd Ste 100 Unit 23, Arlington, VA 22201", phone: "(571) 766-6062", website: "ja-barbershop-llc.square.site", coverImage: "barbershop-43-j-a-barbershop-llc.jpg" },
  { name: "Los Twins Barbershop", address: "2209 N Pershing Dr Ste D, Arlington, VA 22201", phone: "(703) 552-0991", website: "lostwinsbarbershop.com", coverImage: "barbershop-44-los-twins-barbershop.jpg" },
  { name: "Khalid's Barber Shop", address: "901 N Nelson St Retail #140, Arlington, VA 22203", phone: "(571) 458-7359", website: "khalidsbarbershop.com", coverImage: "barbershop-45-khalid-s-barber-shop.jpg" },
  { name: "Illy's Barbershop 2", address: "3219 Columbia Pike Spc B, Arlington, VA 22204", phone: "(571) 970-5526", website: "barbershoparlingtonva.com", coverImage: "barbershop-46-illy-s-barbershop-2.jpg" },
  { name: "Golden Barber Shop", address: "820 N Pollard St Apt 2A, Arlington, VA 22203", phone: "(703) 351-1333", website: "", coverImage: "barbershop-47-golden-barber-shop.jpg" },
  { name: "Style by Susie", address: "4500 Wilson Blvd Loft 21, Arlington, VA 22203", phone: "(703) 943-6262", website: "salonlofts.com", coverImage: "barbershop-48-style-by-susie.jpg" },
  { name: "Lyon Park Barber Shop", address: "2718 Washington Blvd, Arlington, VA 22201", phone: "(703) 528-5949", website: "lyonparkbarbershop.com", coverImage: "barbershop-49-lyon-park-barber-shop.jpg" },
  { name: "Monica's Shear Images", address: "4500 Wilson Blvd #6, Arlington, VA 22203", phone: "(703) 216-2559", website: "monicasshearimages.com", coverImage: "barbershop-50-monica-s-shear-images.jpg" },
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
  return {
    lat: 38.9072 + (Math.random() - 0.5) * 0.01,
    lng: -77.0369 + (Math.random() - 0.5) * 0.01,
  };
}

function findImage(coverImage) {
  // Try exact match first
  const exactPath = join(IMAGES_DIR, coverImage);
  if (existsSync(exactPath)) return coverImage;

  // Fallback: find any file with the same number prefix
  const num = coverImage.split('-')[1]; // e.g. "02"
  const candidates = filesByNum[num] || [];
  if (candidates.length > 0) return candidates[0];

  return null;
}

console.log('Seeding 50 barbershop businesses...\n');

let seeded = 0;
let imgUploaded = 0;

for (const biz of businesses) {
  const city = parseCity(biz.address);
  const slug = slugify(biz.name);
  const coords = getCoords(biz.address, city);

  const { data: existing } = await sb.from('businesses').select('slug').eq('slug', slug);
  const finalSlug = existing && existing.length > 0 ? `${slug}-barber` : slug;

  // Upload cover image
  let coverUrl = null;
  const imgFile = findImage(biz.coverImage);
  if (imgFile) {
    try {
      const imgBuffer = readFileSync(join(IMAGES_DIR, imgFile));
      const storagePath = `covers/${finalSlug}.jpg`;
      const { error: uploadErr } = await sb.storage
        .from('business-images')
        .upload(storagePath, imgBuffer, { contentType: 'image/jpeg', upsert: true });
      if (!uploadErr) {
        const { data: urlData } = sb.storage.from('business-images').getPublicUrl(storagePath);
        coverUrl = urlData.publicUrl;
        imgUploaded++;
      } else {
        console.log(`  IMG skip ${imgFile}: ${uploadErr.message}`);
      }
    } catch (e) {
      console.log(`  IMG error ${imgFile}: ${e.message}`);
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
    description: `${biz.name} is a barbershop in the DMV area.`,
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
