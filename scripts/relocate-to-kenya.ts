import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Kenyan cities with realistic coords for different areas
const relocations: Record<string, { city: string; address: string; lat: number; lng: number }> = {
  "Beat Face Beauty": {
    city: "Nairobi",
    address: "Kenyatta Avenue, Nairobi CBD",
    lat: -1.2864,
    lng: 36.8172,
  },
  "Flawless by Design": {
    city: "Nairobi",
    address: "Ngong Road, Kilimani",
    lat: -1.2985,
    lng: 36.7855,
  },
  "Glam Squad Studio": {
    city: "Eldoret",
    address: "Uganda Road, Eldoret",
    lat: 0.5143,
    lng: 35.2698,
  },
  "GlamOnTheGo": {
    city: "Nairobi",
    address: "Thika Road Mall, Thika Road",
    lat: -1.2195,
    lng: 36.8880,
  },
  "Mobile Beauty KE": {
    city: "Mombasa",
    address: "Nyali Centre, Links Road",
    lat: -4.0219,
    lng: 39.6990,
  },
  "Pulse Fitness": {
    city: "Nanyuki",
    address: "Kenyatta Road, Nanyuki",
    lat: 0.0067,
    lng: 37.0722,
  },
};

async function main() {
  for (const [name, loc] of Object.entries(relocations)) {
    const { error } = await sb.from("businesses").update({
      city: loc.city,
      country: "KE",
      address: loc.address,
      latitude: loc.lat,
      longitude: loc.lng,
    }).eq("name", name);

    if (error) {
      console.log(`ERROR ${name}: ${error.message}`);
    } else {
      console.log(`Moved: ${name} → ${loc.city}, KE (${loc.lat}, ${loc.lng})`);
    }
  }

  // Verify
  const { data } = await sb.from("businesses").select("name, city, country").neq("country", "KE");
  console.log(`\nRemaining non-Kenya: ${data?.length ?? 0}`);
}
main();
