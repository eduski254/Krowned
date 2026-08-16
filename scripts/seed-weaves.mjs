import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_USER_ID = '1538c561-a0fb-4a30-bc6d-1e75fd00a0c7';
const FREE_PLAN_ID = '30e18365-22d1-4416-ac9d-b71c2aa38680';
const WEAVES_CAT_ID = '67bd7f2c-ac06-4589-80d6-a9825828ae96'; // Weaves & Extensions
const IMAGES_DIR = join(process.cwd(), 'images', 'images');

const CITY_COORDS = {
  'Washington': { lat: 38.9072, lng: -77.0369 },
  'Arlington': { lat: 38.8799, lng: -77.1068 },
  'Silver Spring': { lat: 38.9907, lng: -77.0261 },
  'Centreville': { lat: 38.8404, lng: -77.4289 },
  'Great Falls': { lat: 38.9985, lng: -77.2883 },
  'Falls Church': { lat: 38.8823, lng: -77.1711 },
  'Alexandria': { lat: 38.8048, lng: -77.0469 },
};

const businesses = [
  { name: "Monet Salon", address: "14011 St Germain Dr Unit G, Centreville, VA 20121", phone: "(703) 222-0169", website: "monetsalons.com", coverImage: "weaves-01-monet-salon.jpg" },
  { name: "Capital Hair Extensions", address: "1900 M St NW Ste 010, Washington, DC 20036", phone: "(202) 775-1999", website: "capitalhairextension.com", coverImage: "weaves-02-capital-hair-extensions.jpg" },
  { name: "Inizio Hair Salon", address: "641 Florida Ave NW, Washington, DC 20001", phone: "(202) 808-9287", website: "iniziodc.com", coverImage: "weaves-03-inizio-hair-salon.jpg" },
  { name: "Salon Leau and Le Spa", address: "3240 P St NW, Washington, DC 20007", phone: "(202) 625-2220", website: "salonleau.com", coverImage: "weaves-04-salon-leau-le-spa.jpg" },
  { name: "Michael Anthony Salon", address: "661 C St SE 2nd Fl, Washington, DC 20003", phone: "(202) 506-3609", website: "michaelanthonysalondc.com", coverImage: "weaves-05-michael-anthony-salon.jpg" },
  { name: "TheStudeo", address: "1728 Connecticut Ave NW #3A, Washington, DC 20009", phone: "(202) 299-0222", website: "thestudeo.com", coverImage: "weaves-06-thestudeo.jpg" },
  { name: "Kiss Salon", address: "1101 23rd St NW, Washington, DC 20037", phone: "(202) 293-1200", website: "kisssalondc.com", coverImage: "weaves-07-kiss-salon.jpg" },
  { name: "Illusions of Georgetown", address: "1629 Wisconsin Ave NW, Washington, DC 20007", phone: "(202) 338-4100", website: "illusionsofgeorgetown.com", coverImage: "weaves-08-illusions-of-georgetown.jpg" },
  { name: "Ferro Salon-Washington D.C.", address: "1125 18th St NW, Washington, DC 20036", phone: "(202) 785-2222", website: "ferrosalon.com", coverImage: "weaves-09-ferro-salon.jpg" },
  { name: "Hair Lounge Salon - Washington DC", address: "2315 Wisconsin Ave NW, Washington, DC 20007", phone: "(202) 337-0951", website: "hairloungesalon.com", coverImage: "weaves-10-hair-lounge-salon.jpg" },
  { name: "Amor Fati Hair DC", address: "1628 U St NW, Washington, DC 20009", phone: "(202) 848-9263", website: "amorfatihair.com", coverImage: "weaves-11-amor-fati-hair-dc.jpg" },
  { name: "Izzy Salon", address: "1510 31st St NW, Washington, DC 20007", phone: "(202) 301-1111", website: "izzydc.com", coverImage: "weaves-12-izzy-salon.jpg" },
  { name: "Aurora Salon", address: "315 H St NE Ste B, Washington, DC 20002", phone: "(202) 525-4944", website: "aurorasalondc.com", coverImage: "weaves-13-aurora-salon.jpg" },
  { name: "Bang Salon & Aura Spa City Vista", address: "1055 5th St NW, Washington, DC 20001", phone: "(202) 289-7440", website: "bangsalonauraspa.com", coverImage: "weaves-14-bang-salon-aura-spa.jpg" },
  { name: "Saint Germain DC", address: "1301 Pennsylvania Ave NW, Washington, DC 20004", phone: "(202) 824-0444", website: "saintgermainsalon.com", coverImage: "weaves-15-saint-germain-dc.jpg" },
  { name: "Molecule Salon DC", address: "2025 M St NW, Washington, DC 20036", phone: "(202) 822-1588", website: "moleculesalondc.com", coverImage: "weaves-16-molecule-salon-dc.jpg" },
  { name: "Salon Emmanuel - Inclusive Hair Salon / Barbershop", address: "2024 P St NW 1st Floor, Washington, DC 20036", phone: "(202) 924-2008", website: "salon-emmanuel.square.site", coverImage: "weaves-17-salon-emmanuel.jpg" },
  { name: "Mimosa Salon", address: "2305 18th St NW, Washington, DC 20009", phone: "(202) 232-6900", website: "mimosadc.com", coverImage: "weaves-18-mimosa-salon.jpg" },
  { name: "C.H.O.W. Bella Salon", address: "2033 Rhode Island Ave NE, Washington, DC 20018", phone: "(202) 506-6670", website: "styleseat.com", coverImage: "weaves-19-chow-bella-salon.jpg" },
  { name: "StyleBar Hair Salon", address: "1754 Columbia Rd NW 2nd FL, Washington, DC 20009", phone: "(227) 206-8742", website: "stylebaronline.co", coverImage: "weaves-20-stylebar-hair-salon.jpg" },
  { name: "Master Hair Extensions", address: "1900 M St NW Ste 010, Washington, DC 20036", phone: "(540) 413-7290", website: "masterhairextensions.com", coverImage: "weaves-21-master-hair-extensions.jpg" },
  { name: "Sanctuary Hair Solutions", address: "1426 21st St NW Ste 10, Washington, DC 20036", phone: "(202) 494-7739", website: "sanctuaryhairsolutions.com", coverImage: "weaves-22-sanctuary-hair-solutions.jpg" },
  { name: "Logan 14 Aveda Salon & Spa", address: "1314 14th St NW, Washington, DC 20005", phone: "(202) 506-6868", website: "logan14salonspa.com", coverImage: "weaves-23-logan-14-aveda.jpg" },
  { name: "The District Hair Lounge", address: "704 O St NW, Washington, DC 20001", phone: "(202) 506-5880", website: "thedistricthairlounge.com", coverImage: "weaves-24-district-hair-lounge.jpg" },
  { name: "hOm Salon", address: "2020 Wilson Blvd, Arlington, VA 22201", phone: "(703) 705-4110", website: "salonhom.com", coverImage: "weaves-25-hom-salon.jpg" },
  { name: "The Rosewood Salon Co", address: "1144 Walker Rd D, Great Falls, VA 22066", phone: "(571) 766-8419", website: "rosewoodsalonco.com", coverImage: "weaves-26-the-rosewood-salon-co.jpg" },
  { name: "Hair by Rachel Marie", address: "1010 N Glebe Rd, Arlington, VA 22201", phone: "(703) 712-1062", website: "hairbyrachelmarie.com", coverImage: "weaves-27-hair-by-rachel-marie.jpg" },
  { name: "Ombre Salon", address: "822 N Kenmore St, Arlington, VA 22201", phone: "(703) 888-1153", website: "ombresalonandspa.com", coverImage: "weaves-28-ombre-salon.jpg" },
  { name: "Smitten Boutique Salon", address: "2209 N Pershing Dr Unit B, Arlington, VA 22201", phone: "(571) 527-0200", website: "thesmittensalon.com", coverImage: "weaves-29-smitten-boutique-salon.jpg" },
  { name: "Hair Extensions by Diana", address: "7261 Arlington Blvd #134, Falls Church, VA 22042", phone: "(571) 354-5048", website: "", coverImage: "weaves-30-hair-extensions-by-diana.jpg" },
  { name: "Selam Luxury Extensions", address: "5981 Columbia Pike STE 202, Falls Church, VA 22041", phone: "(571) 243-7352", website: "selamluxextensions.com", coverImage: "weaves-31-selam-luxury-extensions.jpg" },
  { name: "Hair Play Salon", address: "4033 Campbell Ave, Arlington, VA 22206", phone: "(703) 824-4247", website: "hairplaysalonva.com", coverImage: "weaves-32-hair-play-salon.jpg" },
  { name: "Bella Li Studio", address: "1330 N Pickett St, Alexandria, VA 22304", phone: "(703) 403-8106", website: "bellalistudio.com", coverImage: "weaves-33-bella-li-studio.jpg" },
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

console.log('Seeding 33 weaves & extensions businesses...\n');

let seeded = 0;
let imgUploaded = 0;

for (const biz of businesses) {
  const city = parseCity(biz.address);
  const slug = slugify(biz.name);
  const coords = getCoords(biz.address, city);

  const { data: existing } = await sb.from('businesses').select('slug').eq('slug', slug);
  const finalSlug = existing && existing.length > 0 ? `${slug}-extensions` : slug;

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

  const { data: inserted, error: insertErr } = await sb.from('businesses').insert({
    name: biz.name,
    slug: finalSlug,
    owner_id: KEEP_USER_ID,
    plan_id: FREE_PLAN_ID,
    primary_category_id: WEAVES_CAT_ID,
    address: biz.address,
    phone: biz.phone || null,
    email: null,
    city: city,
    country: 'US',
    cover_url: coverUrl,
    description: `${biz.name} is a weaves and extensions salon in the DMV area. This listing has not been claimed yet.`,
    is_published: true,
    verification_status: 'verified',
    claimed: false,
    timezone: 'America/New_York',
    latitude: coords.lat,
    longitude: coords.lng,
    social_links: website ? { website } : null,
  }).select('id').single();

  if (insertErr) {
    console.error(`  FAIL ${biz.name}: ${insertErr.message}`);
  } else {
    const days = [0, 1, 2, 3, 4, 5];
    await sb.from('business_hours').insert(days.map(d => ({
      business_id: inserted.id,
      day_of_week: d,
      open_time: '09:00',
      close_time: '19:00',
    })));
    seeded++;
    process.stdout.write(`  [${seeded}/33] ${biz.name}\n`);
  }
}

console.log(`\nDone! Seeded ${seeded} businesses, uploaded ${imgUploaded} images.`);
