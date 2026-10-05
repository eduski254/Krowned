/**
 * Style sub-page definitions for SEO landing pages.
 * Each style belongs to a parent service_category (by slug).
 * Used by /styles/[slug]/[style]/page.tsx
 */

export interface StylePage {
  /** URL slug, e.g. "knotless-braids" */
  slug: string;
  /** Parent category slug, e.g. "braids-protective" */
  categorySlug: string;
  /** H1 displayed on the page */
  h1: string;
  /** Short keyword-rich title for <title> tag (under 60 chars ideally) */
  metaTitle: string;
  /** 150-word intro paragraph (unique per style) */
  intro: string;
  /** Size/length guide rows (optional — only for styles where it makes sense) */
  sizeGuide?: Array<{
    label: string;
    description: string;
  }>;
  /** 4–6 FAQs for FAQPage schema */
  faqs: Array<{ q: string; a: string }>;
}

export const STYLE_PAGES: StylePage[] = [
  // ── Braids & Protective Styling ──────────────────────────────
  {
    slug: "knotless-braids",
    categorySlug: "braids-protective",
    h1: "Knotless Braids in the DMV",
    metaTitle: "Knotless Braids — Stylists in DC, MD & VA",
    intro:
      "Knotless braids start with your own hair and gradually feed in extensions, so there is no bulky knot at the root. The result is a flatter, lighter braid that puts less tension on your edges and scalp. They typically last four to eight weeks with proper care. Whether you want small, medium, large, or jumbo knotless braids, the stylists on Krowned specialize in protective braiding for all hair textures. Browse verified braiders across Washington DC, Maryland, and Northern Virginia, check real-time availability, and book your appointment online.",
    sizeGuide: [
      {
        label: "Extra Small",
        description:
          "Pencil-thin partings. Longest install time (6–10+ hours). Most natural, versatile look. Usually requires 7–9 packs of braiding hair.",
      },
      {
        label: "Small",
        description:
          "Classic size, slightly thicker than extra small. Install takes 5–8 hours. Typically needs 6–8 packs of hair depending on length.",
      },
      {
        label: "Medium",
        description:
          "The most popular size. Balances install time (4–6 hours) with a full look. Usually 5–7 packs of hair.",
      },
      {
        label: "Large",
        description:
          "Chunkier braids, faster install (3–5 hours). Bold statement look. Around 4–6 packs of hair.",
      },
      {
        label: "Jumbo",
        description:
          "Thickest option, quickest install (2–4 hours). Trendy, eye-catching style. Typically 3–5 packs of hair.",
      },
      {
        label: "Waist Length",
        description:
          "Any size taken to waist length or beyond. Adds 1–3 extra packs and 1–2 hours to install time. Ask your stylist about added weight on your scalp.",
      },
    ],
    faqs: [
      {
        q: "How long do knotless braids last?",
        a: "Knotless braids typically last 4–8 weeks depending on your hair texture, braid size, and maintenance routine. Wrapping your hair at night with a satin scarf or bonnet helps extend their life.",
      },
      {
        q: "How many packs of hair do I need for knotless braids?",
        a: "It varies by size and desired length. Extra small braids may need 7–9 packs, small braids 6–8, medium 5–7, and large or jumbo 3–6. Your stylist can give you an exact count during consultation.",
      },
      {
        q: "Do knotless braids damage your hair?",
        a: "Knotless braids are generally considered a low-tension protective style because extensions are fed in gradually rather than knotted at the root. However, braids that are too tight, too heavy, or left in too long can still cause stress. Choose an experienced braider and speak up if anything feels too tight.",
      },
      {
        q: "What is the difference between knotless braids and box braids?",
        a: "Traditional box braids start with a knot that anchors the extension hair to your natural hair. Knotless braids skip the knot and feed hair in gradually, making the base flatter and lighter. Knotless braids tend to be gentler on edges but may take slightly longer to install.",
      },
      {
        q: "How much do knotless braids cost in the DMV?",
        a: "Prices vary widely by stylist, size, and length. Check individual stylist profiles on Krowned for current pricing — each listing shows real service prices so you can compare before booking.",
      },
    ],
  },
  {
    slug: "boho-knotless-braids",
    categorySlug: "braids-protective",
    h1: "Boho Knotless Braids in the DMV",
    metaTitle: "Boho Knotless Braids — Book in DC, MD & VA",
    intro:
      "Boho knotless braids combine the feed-in technique of knotless braids with loose, curly ends for a softer, bohemian finish. The curly tips can be achieved with human hair or textured synthetic hair, and the style works at almost any length. Boho knotless braids are one of the fastest-growing protective styles in the DC, Maryland, and Virginia area. Browse braiders on Krowned who specialize in this look, view their portfolios, and book an appointment with real-time availability.",
    sizeGuide: [
      {
        label: "Small Boho",
        description:
          "Thin braids with curly ends. Longer install time but a very full, natural look.",
      },
      {
        label: "Medium Boho",
        description:
          "Most requested boho size. Balances fullness with a manageable install time.",
      },
      {
        label: "Large / Jumbo Boho",
        description:
          "Chunky braids with dramatic curly ends. Fastest install of the boho options.",
      },
    ],
    faqs: [
      {
        q: "What are boho knotless braids?",
        a: "Boho knotless braids are knotless braids with loose, curly ends left unbraided. The curly section gives the style a relaxed, bohemian look while the braided portion still protects your natural hair.",
      },
      {
        q: "How long do boho knotless braids last?",
        a: "Typically 4–6 weeks. The curly ends may need refreshing sooner than fully braided styles since they are more exposed to friction and tangling.",
      },
      {
        q: "What type of hair is used for boho knotless braids?",
        a: "Most braiders use a combination of braiding hair for the braided section and loose-wave or deep-wave bundles (human or high-quality synthetic) for the curly ends. Ask your stylist what they recommend for your desired look and budget.",
      },
      {
        q: "Can I wash boho knotless braids?",
        a: "Yes. Use a diluted shampoo or a cleansing spray on your scalp, and gently squeeze through the curly ends. Avoid heavy rubbing. Let your hair air-dry or sit under a hooded dryer on low heat.",
      },
      {
        q: "How much do boho knotless braids cost?",
        a: "Pricing depends on size, length, and the type of curly hair used. Check stylist profiles on Krowned for real prices and availability in your area.",
      },
    ],
  },
  {
    slug: "box-braids",
    categorySlug: "braids-protective",
    h1: "Box Braids in the DMV",
    metaTitle: "Box Braids — Find a Braider in DC, MD & VA",
    intro:
      "Box braids are one of the most iconic protective styles — individual braids created by sectioning the hair into box-shaped parts. They come in every size from micro to jumbo and can be styled up, down, or in intricate updos. Box braids typically last six to eight weeks and are a go-to style for length retention and low daily maintenance. Find experienced box braid stylists across Washington DC, Maryland, and Northern Virginia on Krowned. Browse portfolios, compare prices, and book instantly.",
    sizeGuide: [
      {
        label: "Micro / Extra Small",
        description:
          "Very thin braids for a natural, versatile look. Longest install time.",
      },
      {
        label: "Small",
        description:
          "Classic Poetic Justice-era size. Full look with moderate install time.",
      },
      {
        label: "Medium",
        description:
          "Popular everyday size. Good balance of install time and styling versatility.",
      },
      {
        label: "Large",
        description: "Bold, statement braids. Quicker install, great for thick hair.",
      },
      {
        label: "Jumbo",
        description:
          "Thickest option, very fast install. Trendy and lightweight per braid.",
      },
    ],
    faqs: [
      {
        q: "How long do box braids last?",
        a: "Box braids typically last 6–8 weeks with proper maintenance. Keeping your scalp moisturized and sleeping with a satin bonnet or pillowcase helps them last longer.",
      },
      {
        q: "What is the difference between box braids and knotless braids?",
        a: "Box braids use a knot at the root to anchor the extension hair, while knotless braids feed the hair in gradually without a knot. Box braids can feel slightly heavier at the root; knotless braids sit flatter and are generally considered lower tension.",
      },
      {
        q: "Can I do box braids on short hair?",
        a: "Yes, most braiders can install box braids on hair as short as 2–3 inches. The knot technique anchors the extension securely even on shorter hair. Ask your stylist during consultation.",
      },
      {
        q: "How do I maintain box braids?",
        a: "Moisturize your scalp every few days with a lightweight oil or spray. Wrap your braids at night. Avoid excessive pulling or heavy accessories. Wash with a diluted shampoo as needed, focusing on the scalp.",
      },
    ],
  },
  {
    slug: "miracle-knots",
    categorySlug: "braids-protective",
    h1: "Miracle Knots (Miracle Knotless Braids) in the DMV",
    metaTitle: "Miracle Knots — Book in DC, MD & VA",
    intro:
      "Miracle knots — also called miracle knotless braids — are a newer braiding technique that creates an ultra-sleek, flat base with a seamless blend between your natural hair and extensions. The technique minimizes bulk at the root even more than standard knotless braids, giving the braids an almost \"growing from your scalp\" appearance. This style has seen breakout search growth in the DC, Maryland, and Virginia area. Browse braiders on Krowned who offer miracle knots, check their work, and book with real-time availability.",
    faqs: [
      {
        q: "What are miracle knots?",
        a: "Miracle knots are a braiding technique that creates an extremely flat, seamless start to each braid. The name comes from how invisible the transition looks between your natural hair and the added extension hair.",
      },
      {
        q: "How are miracle knots different from regular knotless braids?",
        a: "Both skip the traditional knot. Miracle knots use an even more refined feed-in method that creates a thinner, flatter base. The visual difference is subtle but noticeable — miracle knots tend to look sleeker right at the root.",
      },
      {
        q: "How long do miracle knots last?",
        a: "Similar to knotless braids, miracle knots typically last 4–8 weeks depending on braid size, hair type, and maintenance.",
      },
      {
        q: "Do miracle knots take longer to install?",
        a: "They can take slightly longer than standard knotless braids because the feed-in technique is more precise. Exact timing depends on size and length — ask your braider for an estimate.",
      },
    ],
  },

  // ── Locs ──────────────────────────────────────────────────────
  {
    slug: "loc-retwist",
    categorySlug: "locs",
    h1: "Loc Retwist in the DMV",
    metaTitle: "Loc Retwist — Locticians in DC, MD & VA",
    intro:
      "A loc retwist is the maintenance appointment that keeps your locs neat, healthy, and growing in the right direction. During a retwist, your loctician re-rolls new growth at the root to maintain the shape and pattern of each loc. Most people retwist every four to six weeks, though the right schedule depends on your hair texture and loc maturity. Find experienced locticians across Washington DC, Maryland, and Northern Virginia on Krowned. Compare prices, check availability, and book your next retwist online.",
    faqs: [
      {
        q: "How often should I retwist my locs?",
        a: "Most locticians recommend every 4–6 weeks, but it depends on your hair texture and how quickly your hair grows. Over-twisting can cause thinning, so spacing appointments out is usually better than going too often.",
      },
      {
        q: "What is the best loc retwist gel?",
        a: "Popular options include aloe vera-based gels, organic locking gels, and products specifically formulated for locs. Your loctician can recommend one based on your hair type. Avoid heavy waxes that can cause buildup.",
      },
      {
        q: "How much does a loc retwist cost in the DMV?",
        a: "Prices vary by loctician, loc length, and loc count. Check individual stylist profiles on Krowned for current pricing in your area.",
      },
      {
        q: "Can I wash my locs before a retwist?",
        a: "Many locticians prefer to start on clean hair. Some include a wash in the retwist appointment. Ask your loctician whether to come with freshly washed locs or if they will wash them as part of the service.",
      },
      {
        q: "What is the difference between a retwist and an interlock?",
        a: "A retwist re-rolls new growth in the same direction as the loc. Interlocking pulls the loc through the new growth using a tool, creating a tighter hold that lasts longer between appointments. Your loctician can help you decide which method suits your hair.",
      },
    ],
  },
  {
    slug: "starter-locs",
    categorySlug: "locs",
    h1: "Starter Locs in the DMV",
    metaTitle: "Starter Locs — Locticians in DC, MD & VA",
    intro:
      "Starter locs are the first step in your loc journey. Your loctician will section your hair and create the initial locs using coils, twists, braids, or interlocking — the method depends on your hair texture and the look you want. The starter phase usually lasts three to six months before locs begin to mature and lock on their own. Finding an experienced loctician for this step is important because the parting pattern and sizing set the foundation for the life of your locs. Browse locticians on Krowned across DC, Maryland, and Virginia.",
    faqs: [
      {
        q: "How long does it take to get starter locs?",
        a: "The initial install typically takes 2–4 hours depending on your hair length, density, and the number of locs. Thinner locs and more sections take longer.",
      },
      {
        q: "What method is best for starter locs?",
        a: "It depends on your hair texture. Comb coils work well for tighter textures (4A–4C), two-strand twists are versatile across textures, and interlocking gives immediate hold. Your loctician can recommend the best method during consultation.",
      },
      {
        q: "How do I maintain starter locs?",
        a: "Keep your scalp moisturized, avoid excessive manipulation, sleep with a satin bonnet, and keep your retwist schedule. Avoid heavy products that cause buildup. Be patient — the budding and teenage phase is normal.",
      },
      {
        q: "How long does hair need to be for starter locs?",
        a: "Most locticians recommend at least 3–4 inches of hair, though some methods like interlocking can work on shorter hair. Consult with your loctician about your specific hair length.",
      },
    ],
  },
  {
    slug: "sisterlocks",
    categorySlug: "locs",
    h1: "Sisterlocks & Microlocs in the DMV",
    metaTitle: "Sisterlocks & Microlocs — DC, MD & VA",
    intro:
      "Sisterlocks and microlocs are very small, precisely patterned locs that offer the versatility of loose hair with the permanence of locs. Sisterlocks is a trademarked technique installed with a specialized tool and specific grid pattern — only certified consultants can install them. Microlocs use a similar concept but with varied installation methods. Both styles work on all hair textures and can be styled in updos, curls, and more. Find locticians in Washington DC, Maryland, and Northern Virginia who specialize in small-loc techniques on Krowned.",
    faqs: [
      {
        q: "What is the difference between sisterlocks and microlocs?",
        a: "Sisterlocks is a trademarked system with a specific installation tool and grid pattern, installed only by certified consultants. Microlocs achieve a similar small-loc look using various methods (interlocking, twisting, braiding) without the trademarked system.",
      },
      {
        q: "How long does sisterlock installation take?",
        a: "Initial installation typically takes 12–36 hours spread over 2–3 sessions, depending on hair length and density. This is a significant time investment, but the results last a lifetime with proper maintenance.",
      },
      {
        q: "How much do sisterlocks cost?",
        a: "Because of the specialized training and long install time, sisterlocks tend to cost more than traditional locs. Prices vary by consultant. Check stylist profiles on Krowned for current pricing in your area.",
      },
      {
        q: "Can I color my sisterlocks?",
        a: "Yes, sisterlocks and microlocs can be colored. Many locticians recommend waiting until your locs are mature (6–12 months) before applying chemical color to avoid disrupting the locking process.",
      },
    ],
  },

  // ── Natural Hair & Silk Press ─────────────────────────────────
  {
    slug: "silk-press",
    categorySlug: "natural-silk-press",
    h1: "Silk Press in the DMV",
    metaTitle: "Silk Press — Natural Hair Stylists in DC, MD & VA",
    intro:
      "A silk press is a heat-styling technique that straightens natural hair using a flat iron, leaving it silky, bouncy, and full of movement — without chemicals. A good silk press starts with a thorough wash, deep condition, and blow-dry, followed by careful flat-iron passes with heat protectant. The key is achieving bone-straight results that revert back to your natural curl pattern after the next wash. Find natural-hair stylists in Washington DC, Maryland, and Northern Virginia on Krowned who are known for flawless silk presses without heat damage.",
    faqs: [
      {
        q: "How long does a silk press last?",
        a: "A silk press typically lasts 1–2 weeks depending on your hair texture, humidity, and how well you protect it at night. Wrapping your hair and using a silk or satin pillowcase helps extend the style.",
      },
      {
        q: "Does a silk press damage natural hair?",
        a: "When done correctly with proper heat protectant and the right temperature, a silk press should not cause permanent damage. The key is finding a stylist experienced with natural hair who does not use excessive heat. Avoid getting silk presses too frequently — most stylists recommend spacing them out by at least 4–6 weeks.",
      },
      {
        q: "Will my curls come back after a silk press?",
        a: "Yes. A silk press uses heat only — no chemical relaxers — so your natural curl pattern returns after washing. If your curls do not fully revert, it may be a sign of heat damage from too-high temperatures.",
      },
      {
        q: "How much does a silk press cost in the DMV?",
        a: "Prices depend on hair length, density, and the stylist. Check individual profiles on Krowned for real pricing and availability near you.",
      },
      {
        q: "What is the difference between a silk press and a Dominican blowout?",
        a: "Both straighten natural hair with heat, but the technique differs. A Dominican blowout uses a round-brush blow-dry method with setting, while a silk press relies more heavily on flat-iron passes for a sleeker finish. Both should be chemical-free.",
      },
    ],
  },
];

/** Look up a style by its slug */
export function getStylePage(slug: string): StylePage | undefined {
  return STYLE_PAGES.find((s) => s.slug === slug);
}

/** Get all styles for a given category slug */
export function getStylesForCategory(categorySlug: string): StylePage[] {
  return STYLE_PAGES.filter((s) => s.categorySlug === categorySlug);
}

/** All style slugs grouped by category (for sitemap / static params) */
export function getAllStyleParams(): Array<{ slug: string; style: string }> {
  return STYLE_PAGES.map((s) => ({
    slug: s.categorySlug,
    style: s.slug,
  }));
}
