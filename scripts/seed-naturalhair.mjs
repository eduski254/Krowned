import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_USER_ID = '1538c561-a0fb-4a30-bc6d-1e75fd00a0c7';
const FREE_PLAN_ID = '30e18365-22d1-4416-ac9d-b71c2aa38680';
const NATURAL_HAIR_CAT_ID = 'f9a0910e-d64b-444c-9f26-8e51b5c9807b'; // Natural Hair & Silk Press
const IMAGES_DIR = join(process.cwd(), 'images', 'images');

const CITY_COORDS = {
  'Washington': { lat: 38.9072, lng: -77.0369 },
  'Silver Spring': { lat: 38.9907, lng: -77.0261 },
  'Arlington': { lat: 38.8799, lng: -77.1068 },
  'Temple Hills': { lat: 38.8140, lng: -76.9455 },
  'Gaithersburg': { lat: 39.1434, lng: -77.2014 },
};

const businesses = [
  { name: "Twist It Sista @ 329, LLC", address: "329 Adams St NE, Washington, DC 20002", phone: "(202) 832-3157", website: "twistit329.com", coverImage: "naturalhair-01-twist-it-sista.jpg" },
  { name: "Yoni Beauty Salon", address: "4528 Georgia Ave NW, Washington, DC 20011", phone: "(202) 751-1558", website: "", coverImage: "naturalhair-02-yoni-beauty-salon.jpg" },
  { name: "N Natural Hair Studio", address: "11207B Lockwood Dr, Silver Spring, MD 20901", phone: "(301) 901-8047", website: "", coverImage: "naturalhair-03-n-natural-hair-studio.jpg" },
  { name: "Cole Stevens Salon", address: "1247 E St SE, Washington, DC 20003", phone: "(202) 547-4444", website: "colestevenssalon.com", coverImage: "naturalhair-04-cole-stevens-salon.jpg" },
  { name: "B Forever Flawless", address: "7305 Georgia Ave NW, Washington, DC 20012", phone: "(202) 652-0475", website: "", coverImage: "naturalhair-05-b-forever-flawless.jpg" },
  { name: "Eden DC Salon", address: "1204 H St NE, Washington, DC 20002", phone: "(202) 715-0474", website: "edendcsalon.com", coverImage: "naturalhair-06-eden-dc-salon.jpg" },
  { name: "Fiddleheads Salon", address: "1515 17th St NW, Washington, DC 20006", phone: "(202) 805-0520", website: "fiddleheadsdc.com", coverImage: "naturalhair-07-fiddleheads-salon.jpg" },
  { name: "Urban Natural Silver Spring", address: "937 Bonifant St, Silver Spring, MD 20910", phone: "(301) 560-1500", website: "urbannaturalhair.com", coverImage: "naturalhair-08-urban-natural-silver-spring.jpg" },
  { name: "Last Tangle In Washington Salon", address: "1900 M St NW Ste 010, Washington, DC 20036", phone: "(202) 775-1999", website: "lasttangle.com", coverImage: "naturalhair-09-last-tangle.jpg" },
  { name: "Thrive Hair Bar - DC", address: "528 H St NE, Washington, DC 20002", phone: "(202) 481-4394", website: "thrivehairbar.com", coverImage: "naturalhair-10-thrive-hair-bar-dc.jpg" },
  { name: "Jasmine's Hair Gallery", address: "2202 Martin Luther King Jr Ave SE, Washington, DC 20020", phone: "(202) 678-7095", website: "", coverImage: "naturalhair-11-jasmines-hair-gallery.jpg" },
  { name: "Vibrant Textures Hair Studio", address: "3530 12th St NE, Washington, DC 20017", phone: "(202) 248-1184", website: "vibranttextures.com", coverImage: "naturalhair-12-vibrant-textures.jpg" },
  { name: "Grace Filled Hands Hair Studio", address: "7323 Georgia Ave NW, Washington, DC 20012", phone: "(202) 248-4244", website: "", coverImage: "naturalhair-13-grace-filled-hands.jpg" },
  { name: "Maggy's Beauty Salon", address: "2407 18th St NW BSMT, Washington, DC 20009", phone: "(202) 232-6190", website: "maggysbeauty.com", coverImage: "naturalhair-14-maggys-beauty-salon.jpg" },
  { name: "David Rios Salon & Spa", address: "1519 Wisconsin Ave NW, Washington, DC 20007", phone: "(202) 525-2613", website: "davidrios.net", coverImage: "naturalhair-15-david-rios-salon.jpg" },
  { name: "Naya's Chair | Holistic Hair Care", address: "1805 Benning Rd NE, Washington, DC 20002", phone: "", website: "nayaschair.glossgenius.com", coverImage: "naturalhair-16-nayas-chair.jpg" },
  { name: "Natural Hair Goddess", address: "4526 Benning Rd SE, Washington, DC 20019", phone: "(919) 637-9127", website: "diamondandruff.booksy.com", coverImage: "naturalhair-17-natural-hair-goddess.jpg" },
  { name: "Columbia Hair Salon Inc", address: "1760 Columbia Rd NW #1b, Washington, DC 20009", phone: "(202) 462-4013", website: "columbiahair-salon.com", coverImage: "naturalhair-18-columbia-hair-salon.jpg" },
  { name: "Salon Cielo", address: "1728 Connecticut Ave NW Ste 2A, Washington, DC 20009", phone: "(202) 232-4572", website: "salonsielo.com", coverImage: "naturalhair-19-salon-cielo.jpg" },
  { name: "Tsunami Hair Studio", address: "4248 Benning Rd NE, Washington, DC 20019", phone: "(202) 748-5608", website: "tsunamihairdc.com", coverImage: "naturalhair-20-tsunami-hair-studio.jpg" },
  { name: "MOXee Salon & Spa", address: "2401 Pennsylvania Ave NW # G, Washington, DC 20037", phone: "(202) 975-1109", website: "moxeesalon.net", coverImage: "naturalhair-21-moxee-salon-spa.jpg" },
  { name: "Hair by Kalizya", address: "3901 Georgia Ave NW, Washington, DC 20011", phone: "(202) 714-4909", website: "kalizya.com", coverImage: "naturalhair-22-hair-by-kalizya.jpg" },
  { name: "INARI Salon and Spa", address: "1425 K St NW Ste 102, Washington, DC 20005", phone: "(202) 898-6350", website: "inarisalon.com", coverImage: "naturalhair-23-inari-salon-spa.jpg" },
  { name: "Thrive Hair Bar - Arlington", address: "1010 N Glebe Rd #100, Arlington, VA 22201", phone: "(703) 969-1395", website: "thrivehairbar.com", coverImage: "naturalhair-24-thrive-hair-bar-arlington.jpg" },
  { name: "Cavalry Salon", address: "1645 Connecticut Ave NW, Washington, DC 20009", phone: "(202) 223-2066", website: "cavalrydc.com", coverImage: "naturalhair-25-cavalry-salon.jpg" },
  { name: "Mishawn's Salon", address: "6504 Old Branch Ave Ste 104, Temple Hills, MD 20748", phone: "(301) 238-4778", website: "mishawnssalon.godaddysites.com", coverImage: "naturalhair-26-mishawns-salon.jpg" },
  { name: "My Natural Hair Spa", address: "363 Muddy Branch Rd #111-112, Gaithersburg, MD 20878", phone: "(240) 217-0335", website: "mynaturalhairspa.square.site", coverImage: "naturalhair-27-my-natural-hair-spa.jpg" },
  { name: "Salon EGEAUX", address: "955 D St SW Suite 106, Washington, DC 20024", phone: "(202) 313-2931", website: "salonegeaux.com", coverImage: "naturalhair-28-salon-egeaux.jpg" },
  { name: "Posh Hair Spa & Waxing", address: "2025 M St NW, Washington, DC 20036", phone: "(202) 480-2628", website: "poshsalondc.com", coverImage: "naturalhair-29-posh-hair-spa.jpg" },
  { name: "Lumen Salon", address: "1502 Wisconsin Ave NW, Washington, DC 20007", phone: "(202) 676-6313", website: "lumensalon.com", coverImage: "naturalhair-30-lumen-salon.jpg" },
  { name: "Dazzles", address: "1340 H St NE, Washington, DC 20002", phone: "(202) 398-4880", website: "", coverImage: "naturalhair-31-dazzles.jpg" },
  { name: "Salon Revive", address: "944 Florida Ave NW, Washington, DC 20001", phone: "(202) 232-1008", website: "salonrevive.com", coverImage: "naturalhair-32-salon-revive.jpg" },
  { name: "One80 Salon", address: "1275 K St NW #101, Washington, DC 20005", phone: "(202) 842-9113", website: "one80salon.com", coverImage: "naturalhair-33-one80-salon.jpg" },
  { name: "Signature Image Salon", address: "1517 U St NW 2nd Floor, Washington, DC 20009", phone: "(202) 560-5647", website: "signatureimagesalon.com", coverImage: "naturalhair-34-signature-image-salon.jpg" },
  { name: "MoniqueNicole Hair Studio, LLC", address: "1242 Pennsylvania Ave SE Suite B, Washington, DC 20003", phone: "(202) 380-8233", website: "monique-nicolehairstudio.com", coverImage: "naturalhair-35-moniquenicole-hair-studio.jpg" },
  { name: "Blondie's Spa Hair Studio", address: "1910 18th St NW, Washington, DC 20009", phone: "(202) 232-8338", website: "blondiesdc.com", coverImage: "naturalhair-36-blondies-spa-hair-studio.jpg" },
  { name: "The JPrince Experience", address: "4248 Benning Rd NE, Washington, DC 20019", phone: "(202) 743-5719", website: "jprinceexperience.com", coverImage: "naturalhair-37-the-jprince-experience.jpg" },
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

console.log('Seeding 37 natural hair businesses...\n');

let seeded = 0;
let imgUploaded = 0;

for (const biz of businesses) {
  const city = parseCity(biz.address);
  const slug = slugify(biz.name);
  const coords = getCoords(biz.address, city);

  const { data: existing } = await sb.from('businesses').select('slug').eq('slug', slug);
  const finalSlug = existing && existing.length > 0 ? `${slug}-natural` : slug;

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

  // Add business hours (Mon-Sat 9-7)
  const { data: inserted, error: insertErr } = await sb.from('businesses').insert({
    name: biz.name,
    slug: finalSlug,
    owner_id: KEEP_USER_ID,
    plan_id: FREE_PLAN_ID,
    primary_category_id: NATURAL_HAIR_CAT_ID,
    address: biz.address,
    phone: biz.phone || null,
    email: null,
    city: city,
    country: 'US',
    cover_url: coverUrl,
    description: `${biz.name} is a natural hair salon in the DMV area. This listing has not been claimed yet.`,
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
    // Add business hours Mon-Sat 9-7
    const days = [0, 1, 2, 3, 4, 5];
    const hours = days.map(d => ({
      business_id: inserted.id,
      day_of_week: d,
      open_time: '09:00',
      close_time: '19:00',
    }));
    await sb.from('business_hours').insert(hours);

    seeded++;
    process.stdout.write(`  [${seeded}/37] ${biz.name}\n`);
  }
}

console.log(`\nDone! Seeded ${seeded} businesses, uploaded ${imgUploaded} images.`);
