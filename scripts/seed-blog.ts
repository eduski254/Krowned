/**
 * Seed blog posts for Krowned.
 * Run: npx tsx scripts/seed-blog.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const posts = [
  {
    title: "5 Protective Styles That Actually Promote Hair Growth",
    slug: "protective-styles-hair-growth",
    excerpt:
      "Looking to grow your hair while keeping it stylish? These five protective styles shield your ends from damage and lock in moisture — all while looking stunning.",
    body: `<h2>Why Protective Styling Matters</h2>
<p>Protective styles aren't just about aesthetics — they're a proven strategy for length retention. By tucking away your ends and minimizing manipulation, you give your hair the best environment to thrive.</p>

<h3>1. Knotless Braids</h3>
<p>Unlike traditional box braids, knotless braids start with your natural hair and gradually feed in extensions. This means less tension on your scalp and edges. They're lightweight, versatile, and can last 6-8 weeks with proper care.</p>
<p><strong>Pro tip:</strong> Keep your scalp moisturized with a lightweight oil and wrap your braids in a silk scarf at night.</p>

<h3>2. Passion Twists</h3>
<p>These springy, bohemian twists use water wave hair for a soft, romantic look. They're gentler than many braid styles because they don't require tight twisting at the root.</p>

<h3>3. Flat Twists into a Low Bun</h3>
<p>A simple yet elegant style you can do at home. Flat twist sections toward the back and pin into a bun. This keeps ends completely tucked while looking polished for any occasion.</p>

<h3>4. Locs (Starter or Faux)</h3>
<p>Whether you're starting your loc journey or trying faux locs for a temporary look, this style requires minimal daily manipulation — the gold standard for length retention.</p>

<h3>5. Cornrows with Extensions</h3>
<p>A classic that never goes out of style. Feed-in cornrows distribute weight evenly and can be styled in countless patterns. Keep them for 2-4 weeks max to prevent buildup.</p>

<h2>The Bottom Line</h2>
<p>The best protective style is one that's installed without excessive tension, maintained with moisture, and removed gently. Book a consultation with a Krowned professional to find the perfect style for your hair goals.</p>`,
    tags: ["protective styles", "hair growth", "braids", "natural hair"],
    cover_image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=630&fit=crop",
    meta_title: "5 Protective Styles That Promote Hair Growth | Krowned",
    meta_description: "Discover the top protective hairstyles that help your natural hair grow while keeping you looking amazing. Expert tips from Krowned professionals.",
  },
  {
    title: "How to Find the Right Stylist for Your Texture",
    slug: "find-right-stylist-texture",
    excerpt:
      "Not every stylist understands textured hair. Here's how to find a professional who truly gets your curl pattern, density, and unique needs.",
    body: `<h2>Your Hair Deserves a Specialist</h2>
<p>Finding a stylist who understands textured hair can feel like searching for a needle in a haystack. But it doesn't have to be. Here's a framework for finding your perfect match.</p>

<h3>Know Your Hair Profile</h3>
<p>Before you book, understand the basics about your hair:</p>
<ul>
<li><strong>Curl pattern:</strong> 3A-4C (or a combination)</li>
<li><strong>Density:</strong> Low, medium, or high</li>
<li><strong>Porosity:</strong> How well your hair absorbs moisture</li>
<li><strong>Width:</strong> Fine, medium, or coarse strands</li>
</ul>

<h3>What to Look for in a Stylist</h3>
<p><strong>Portfolio diversity:</strong> Check their work on clients with similar textures to yours. A gallery full of Type 4 hair is a great sign if that's your texture.</p>
<p><strong>Product knowledge:</strong> Ask what products they use. A good textured-hair stylist will have opinions about ingredients, not just brands.</p>
<p><strong>Consultation approach:</strong> The best stylists ask questions before they touch your hair. They want to understand your routine, goals, and any sensitivities.</p>

<h3>Red Flags to Watch For</h3>
<ul>
<li>They suggest relaxing or texturizing without you asking</li>
<li>They use excessive heat without discussing it first</li>
<li>They don't have products suitable for your texture on hand</li>
<li>They rush through detangling</li>
</ul>

<h3>Use Krowned to Your Advantage</h3>
<p>On Krowned, every stylist's profile shows their specialties, the textures they work with, and real reviews from clients with similar hair. Use the filters to narrow down professionals who specialize in your specific needs.</p>

<h2>Your First Appointment</h2>
<p>Book a consultation or a simple style first — not a big chop or color. This lets you evaluate the stylist's technique, communication, and how your hair feels afterward. Trust is built over time.</p>`,
    tags: ["finding a stylist", "textured hair", "curl pattern", "tips"],
    cover_image_url: "https://images.unsplash.com/photo-1595959183082-7b570b7e1e2b?w=1200&h=630&fit=crop",
    meta_title: "How to Find the Right Stylist for Textured Hair | Krowned",
    meta_description: "A guide to finding a hairstylist who truly understands your curl pattern, density, and texture. Tips for evaluating portfolios, consultations, and red flags.",
  },
  {
    title: "The Ultimate Wash Day Routine for 4C Hair",
    slug: "wash-day-routine-4c-hair",
    excerpt:
      "Wash day doesn't have to be an all-day struggle. This streamlined routine keeps 4C hair moisturized, detangled, and defined in under 2 hours.",
    body: `<h2>Wash Day, Simplified</h2>
<p>If wash day feels like running a marathon, you're not alone. 4C hair is beautiful, versatile, and — let's be honest — requires intention. Here's a routine that respects your time and your texture.</p>

<h3>Step 1: Pre-Poo (15 min)</h3>
<p>Section your hair into 4-6 twists. Apply a generous amount of olive oil or a pre-poo treatment to each section. This protects your strands from the stripping effects of shampoo and makes detangling infinitely easier.</p>

<h3>Step 2: Shampoo (10 min)</h3>
<p>Use a sulfate-free shampoo — your 4C hair doesn't need harsh cleansers. Focus on your scalp, not your lengths. Let the suds run down to clean the rest. One wash is usually enough unless you have heavy product buildup.</p>

<h3>Step 3: Deep Condition (30 min)</h3>
<p>This is non-negotiable for 4C hair. Apply a protein-moisture balanced deep conditioner, clip sections up, and cover with a plastic cap. Use your body heat or a hooded dryer. Rinse with cool water to seal the cuticle.</p>

<h3>Step 4: Leave-In + Detangle (20 min)</h3>
<p>On soaking wet hair, apply a generous amount of leave-in conditioner. Detangle with a wide-tooth comb or Denman brush, working from ends to roots. Never force through knots — patience is your friend.</p>

<h3>Step 5: Style (30 min)</h3>
<p>Apply your styling products (cream + gel for definition, or butter for stretch). Twist, braid, or shingle depending on your desired look. Sit under a hooded dryer or air dry.</p>

<h3>Pro Tips</h3>
<ul>
<li>Wash day should happen every 7-10 days for most 4C textures</li>
<li>Never skip the deep condition — it's the difference between thriving and surviving</li>
<li>Invest in a satin-lined cap for drying days</li>
<li>Keep a spray bottle of water + leave-in for mid-week refreshes</li>
</ul>

<p>Need a professional deep treatment or trim? Book a wash-and-style session with a Krowned stylist who specializes in 4C care.</p>`,
    tags: ["4C hair", "wash day", "natural hair", "routine", "moisture"],
    cover_image_url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&h=630&fit=crop",
    meta_title: "The Ultimate Wash Day Routine for 4C Hair | Krowned",
    meta_description: "A streamlined 4C wash day routine under 2 hours. Pre-poo, shampoo, deep condition, detangle, and style — with pro tips for moisture retention.",
  },
  {
    title: "Why Every Braider Should Be on Krowned",
    slug: "why-braiders-should-join-krowned",
    excerpt:
      "If you're a braider or loc technician still relying on DMs and word-of-mouth, you're leaving money on the table. Here's why Krowned is the platform built for you.",
    body: `<h2>Built for Textured-Hair Professionals</h2>
<p>Most booking platforms were designed for blowouts and balayage. Krowned was built from the ground up for braiders, loc techs, natural hair stylists, and textured-hair specialists. Here's what that means for your business.</p>

<h3>Stop Chasing Clients in DMs</h3>
<p>Every hour you spend going back and forth in Instagram DMs is an hour you're not making money. With Krowned, clients see your availability in real-time, book instantly, and pay upfront. No more "I'll let you know" ghosting.</p>

<h3>Get Paid What You're Worth</h3>
<p>Set your own prices, require deposits, and accept payments directly to your bank account. No more Zelle confusion or Cash App mix-ups. Clients see the full price before they book — no awkward money conversations.</p>

<h3>Your Portfolio, Professional</h3>
<p>Your Krowned profile is your digital business card. Upload your best work, list your specialties, set your hours, and let your reviews speak for themselves. Clients searching for "knotless braids near me" will find YOU.</p>

<h3>Features That Actually Help</h3>
<ul>
<li><strong>Smart scheduling:</strong> Block off time for long styles, set buffer time between clients</li>
<li><strong>Service catalog:</strong> List every style with duration, price, and photos</li>
<li><strong>Client management:</strong> Track who's coming, what they got last time, and when they're due back</li>
<li><strong>Team support:</strong> Growing? Add staff members and manage everyone's schedule in one place</li>
</ul>

<h3>14-Day Free Trial, No Card Required</h3>
<p>We're so confident you'll love Krowned that we give you full access to every feature for 14 days — no credit card, no strings. Set up your profile, get your first booking, and see the difference.</p>

<h2>Join the Movement</h2>
<p>Krowned isn't just a booking app. It's a community of textured-hair professionals who are tired of being an afterthought on generic platforms. Your craft deserves a dedicated home.</p>`,
    tags: ["for professionals", "braiders", "business", "booking"],
    cover_image_url: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=1200&h=630&fit=crop",
    meta_title: "Why Every Braider Should Be on Krowned | For Professionals",
    meta_description: "Stop chasing clients in DMs. Krowned gives braiders and loc techs professional booking, payments, and client management — built for textured hair.",
  },
  {
    title: "Summer Hair Care: Protecting Textured Hair from Sun and Chlorine",
    slug: "summer-hair-care-textured-hair",
    excerpt:
      "Sun, pools, and salt water can wreak havoc on textured hair. Here's how to enjoy your summer without sacrificing your hair health.",
    body: `<h2>Summer + Textured Hair = Extra Care</h2>
<p>We love a good pool day, but chlorine and UV rays don't love our hair back. The good news? With a few preventive steps, you can enjoy summer fully without a setback in your hair journey.</p>

<h3>Before the Pool</h3>
<p><strong>Wet your hair first.</strong> Hair is like a sponge — if it's already saturated with clean water, it absorbs less chlorine. Rinse thoroughly, then apply a leave-in conditioner or oil as a barrier.</p>
<p><strong>Protective style it.</strong> Braids, twists, or a high bun keep your hair contained and minimize surface area exposed to chemicals.</p>

<h3>After the Pool</h3>
<p><strong>Rinse immediately.</strong> Don't let chlorine sit. If you can't do a full wash, at least rinse with fresh water and apply a leave-in.</p>
<p><strong>Apple cider vinegar rinse:</strong> Mix 1 part ACV with 3 parts water. This helps remove chlorine buildup and restore your hair's pH balance.</p>

<h3>Sun Protection</h3>
<p>UV rays break down protein in your hair shaft, leading to dryness and color fading. Options:</p>
<ul>
<li>UV-protectant sprays (yes, they exist for hair)</li>
<li>Satin-lined hats and headwraps</li>
<li>Styles that tuck your ends away from direct sunlight</li>
</ul>

<h3>Hydration is Everything</h3>
<p>Summer heat means faster moisture loss. Increase your deep conditioning frequency to weekly, and keep a spray bottle with water and aloe juice for mid-day refreshes. Your hair (and scalp) will thank you.</p>

<h3>Beach Hair Tips</h3>
<ul>
<li>Salt water is actually less damaging than chlorine, but still drying</li>
<li>Pre-treat with coconut oil before ocean swimming</li>
<li>Embrace the texture! Sea salt can create beautiful definition in some curl patterns</li>
<li>Always follow up with a moisturizing wash within 24 hours</li>
</ul>

<p>Need a post-summer refresh? Book a hydrating treatment or protective style with a Krowned professional to get your hair back on track.</p>`,
    tags: ["summer", "hair care", "tips", "natural hair", "protective styles"],
    cover_image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=630&fit=crop",
    meta_title: "Summer Hair Care for Textured Hair | Krowned",
    meta_description: "Protect your textured hair from sun, chlorine, and salt water this summer. Pre-swim prep, post-swim care, and hydration tips from Krowned experts.",
  },
  {
    title: "The History of Braiding: From Ancient Africa to Modern Runways",
    slug: "history-of-braiding",
    excerpt:
      "Braiding is more than a hairstyle — it's a cultural legacy spanning thousands of years. Explore the rich history behind the art we celebrate today.",
    body: `<h2>A Legacy Woven in Hair</h2>
<p>When you sit in a braider's chair, you're participating in a tradition that stretches back over 5,000 years. Braiding isn't just styling — it's storytelling, identity, and community.</p>

<h3>Ancient Origins</h3>
<p>The oldest known evidence of braiding comes from the Tassili n'Ajjer caves in Algeria, where rock paintings dating to 3500 BCE depict women with braided hairstyles. In ancient Africa, braiding patterns could indicate a person's tribe, age, marital status, wealth, and religion.</p>

<h3>Braiding as Communication</h3>
<p>In many West African cultures, braids served as a language. Specific patterns could signal:</p>
<ul>
<li>Social status and rank within the community</li>
<li>Readiness for marriage or other life transitions</li>
<li>Mourning or celebration</li>
<li>Geographic origin and tribal affiliation</li>
</ul>

<h3>The Middle Passage and Survival</h3>
<p>During the transatlantic slave trade, braiding took on new significance. There are accounts of enslaved Africans braiding rice seeds and gold into their hair for survival. Cornrow patterns were even used as maps to escape routes — the original GPS encoded in hair.</p>

<h3>20th Century: Suppression and Reclamation</h3>
<p>For decades, natural Black hairstyles were stigmatized in Western workplaces and schools. The CROWN Act movement (Creating a Respectful and Open World for Natural Hair) has been fighting to end hair discrimination, with multiple states passing protective legislation.</p>

<h3>Braiding Today</h3>
<p>Today, braiding is experiencing a renaissance. From red carpets to runway shows, textured hairstyles are being celebrated (though conversations about credit and cultural appreciation remain important). The global braiding industry is valued at billions, and professional braiders are finally being recognized as the skilled artists they've always been.</p>

<h2>Honoring the Craft</h2>
<p>At Krowned, we believe braiding is an art form that deserves professional recognition, fair compensation, and a dedicated platform. Every style carries history. Every braider carries forward an ancient tradition.</p>`,
    tags: ["culture", "braiding history", "natural hair", "community"],
    cover_image_url: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1200&h=630&fit=crop",
    meta_title: "The History of Braiding: Ancient Africa to Modern Day | Krowned",
    meta_description: "Explore 5,000 years of braiding history — from ancient African traditions to modern runways. The cultural legacy behind the art we celebrate.",
  },
];

async function main() {
  // Get super admin profile ID for author
  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin")
    .limit(1)
    .single();

  if (!admin) {
    console.error("No super_admin profile found. Cannot seed blog posts.");
    process.exit(1);
  }

  console.log(`Using author_id: ${admin.id}\n`);

  // Delete old posts first
  await supabase.from("blog_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared existing blog posts.\n");

  let created = 0;
  for (const post of posts) {
    const { error } = await supabase.from("blog_posts").insert({
      ...post,
      author_id: admin.id,
      author_name: "Krowned Team",
      status: "published" as const,
      published_at: new Date(
        Date.now() - (posts.length - created) * 3 * 24 * 60 * 60_000,
      ).toISOString(),
    });

    if (error) {
      console.error(`  FAILED: ${post.title} — ${error.message}`);
    } else {
      console.log(`  OK: ${post.title}`);
      created++;
    }
  }

  console.log(`\nSeeded ${created}/${posts.length} blog posts.`);
}

main();
