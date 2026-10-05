/**
 * DMV city definitions for explore landing pages.
 * Single source of truth — used by /explore/[city], /explore/[city]/[style],
 * the sitemap, and internal linking.
 */

export interface CityPage {
  name: string;
  region: string;
  intro: string;
  /** City values in the businesses.city column that map to this page */
  dbMatches: string[];
}

export const CITY_PAGES: Record<string, CityPage> = {
  // ── DC ──────────────────────────────────────────────────────
  "washington-dc": {
    name: "Washington, DC",
    region: "DC",
    intro:
      "Find braiders, loc techs, barbers, and natural-hair stylists across Washington, DC. From Capitol Hill to Anacostia, Georgetown to Petworth — verified stylists, real availability, instant booking.",
    dbMatches: ["Washington", "Washington DC", "Washington, DC", "DC"],
  },

  // ── Maryland ────────────────────────────────────────────────
  "silver-spring-md": {
    name: "Silver Spring",
    region: "MD",
    intro:
      "Book braiders, locticians, and barbers in Silver Spring, Maryland. Browse verified textured-hair professionals with real-time availability.",
    dbMatches: ["Silver Spring"],
  },
  "bowie-md": {
    name: "Bowie",
    region: "MD",
    intro:
      "Find textured-hair stylists in Bowie, Maryland. Braids, locs, silk press, fades — browse verified professionals and book instantly.",
    dbMatches: ["Bowie"],
  },
  "hyattsville-md": {
    name: "Hyattsville",
    region: "MD",
    intro:
      "Book textured-hair professionals in Hyattsville, Maryland. Knotless braids, retwists, sew-ins, and more from verified stylists.",
    dbMatches: ["Hyattsville"],
  },
  "largo-md": {
    name: "Largo",
    region: "MD",
    intro:
      "Find braiders, loc techs, and barbers in Largo, Maryland. Real availability, verified stylists, instant booking on Krowned.",
    dbMatches: ["Largo"],
  },
  "bethesda-md": {
    name: "Bethesda",
    region: "MD",
    intro:
      "Book textured-hair stylists in Bethesda, Maryland. Browse professionals specializing in braids, locs, silk press, and more.",
    dbMatches: ["Bethesda"],
  },
  "lanham-md": {
    name: "Lanham",
    region: "MD",
    intro:
      "Find locticians and braiders in Lanham, Maryland. Seven textured-hair professionals with real availability — browse and book on Krowned.",
    dbMatches: ["Lanham"],
  },
  "waldorf-md": {
    name: "Waldorf",
    region: "MD",
    intro:
      "Book locticians and textured-hair stylists in Waldorf, Maryland. Browse verified professionals specializing in locs, retwists, and protective styles.",
    dbMatches: ["Waldorf"],
  },
  "temple-hills-md": {
    name: "Temple Hills",
    region: "MD",
    intro:
      "Find locticians and natural-hair stylists in Temple Hills, Maryland. Browse verified professionals and book your next appointment online.",
    dbMatches: ["Temple Hills"],
  },
  "upper-marlboro-md": {
    name: "Upper Marlboro",
    region: "MD",
    intro:
      "Book locticians in Upper Marlboro, Maryland. Browse verified loc specialists with real-time availability on Krowned.",
    dbMatches: ["Upper Marlboro"],
  },

  // ── Virginia ────────────────────────────────────────────────
  "alexandria-va": {
    name: "Alexandria",
    region: "VA",
    intro:
      "Find braiders, locticians, barbers, and natural-hair specialists in Alexandria, Virginia. Verified stylists with real-time booking.",
    dbMatches: ["Alexandria"],
  },
  "arlington-va": {
    name: "Arlington",
    region: "VA",
    intro:
      "Book textured-hair professionals in Arlington, Virginia. Braids, locs, cuts, color — browse verified stylists and book instantly.",
    dbMatches: ["Arlington"],
  },
  "fairfax-va": {
    name: "Fairfax",
    region: "VA",
    intro:
      "Find textured-hair stylists in Fairfax, Virginia. Knotless braids, retwists, fades, silk press, and more from verified professionals.",
    dbMatches: ["Fairfax"],
  },
  "ashburn-va": {
    name: "Ashburn",
    region: "VA",
    intro:
      "Find braiders in Ashburn, Virginia. Five verified protective-style specialists — browse portfolios and book your appointment on Krowned.",
    dbMatches: ["Ashburn"],
  },
  "woodbridge-va": {
    name: "Woodbridge",
    region: "VA",
    intro:
      "Book locticians in Woodbridge, Virginia. Browse verified loc specialists with real-time availability and book online.",
    dbMatches: ["Woodbridge"],
  },
  "falls-church-va": {
    name: "Falls Church",
    region: "VA",
    intro:
      "Find braiders and extension specialists in Falls Church, Virginia. Browse verified stylists and book your next appointment online.",
    dbMatches: ["Falls Church"],
  },
  "herndon-va": {
    name: "Herndon",
    region: "VA",
    intro:
      "Book braiders in Herndon, Virginia. Browse verified protective-style specialists and book your appointment on Krowned.",
    dbMatches: ["Herndon"],
  },
  "sterling-va": {
    name: "Sterling",
    region: "VA",
    intro:
      "Find braiders in Sterling, Virginia. Browse verified protective-style specialists with real availability on Krowned.",
    dbMatches: ["Sterling"],
  },
};

/** All city slugs (for sitemap, static params, etc.) */
export const CITY_SLUGS = Object.keys(CITY_PAGES);
