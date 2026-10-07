/**
 * Typical services by category slug — used to enrich unclaimed listings
 * that haven't added their own service menu yet.
 * These are standard services commonly offered by shops in each category,
 * clearly labeled as "typical" (not the shop's actual menu).
 */

export const CATEGORY_TYPICAL_SERVICES: Record<string, string[]> = {
  "braids-protective": [
    "Knotless Braids",
    "Box Braids",
    "Feed-in Braids",
    "Cornrows",
    "Fulani Braids",
    "Goddess Locs",
    "Passion Twists",
    "Tribal Braids",
    "Crochet Braids",
  ],
  locs: [
    "Starter Locs",
    "Loc Retwist",
    "Interlocks",
    "Loc Repair",
    "Faux Locs",
    "Butterfly Locs",
    "Soft Locs",
    "Loc Styling",
    "Loc Detox",
  ],
  "natural-silk-press": [
    "Silk Press",
    "Wash & Go",
    "Twist Out",
    "Rod Set",
    "Blowout",
    "Deep Conditioning Treatment",
    "Trim & Shape",
    "Scalp Treatment",
  ],
  "weaves-extensions": [
    "Sew-in Weave",
    "Lace Closure Install",
    "Lace Frontal Install",
    "Tape-in Extensions",
    "Clip-in Extensions",
    "Wig Install",
    "Quick Weave",
    "Ponytail Install",
  ],
  "barbering-cuts": [
    "Fade",
    "Taper",
    "Line-up",
    "Beard Trim",
    "Razor Part",
    "Buzz Cut",
    "Mohawk",
    "Design Cut",
    "Hot Towel Shave",
  ],
  color: [
    "Full Color",
    "Highlights",
    "Balayage",
    "Loc Color",
    "Bleach & Tone",
    "Vivid Color",
    "Color Correction",
    "Gloss Treatment",
  ],
};
