/**
 * Data for service-type landing pages: /locticians/[city], /braiders/[city], etc.
 * These target high-intent "near me" queries already getting impressions in GSC.
 */

import { CITY_PAGES, type CityPage } from "./cities-data";

export interface ServiceLanding {
  /** URL prefix: "locticians", "braiders", "barbers", "hair-extensions" */
  slug: string;
  /** Singular noun for headings: "loctician", "braider", "barber" */
  singular: string;
  /** Plural noun */
  plural: string;
  /** Category slugs in the DB to match (service_categories.slug) */
  categorySlugs: string[];
  /** Default meta description template (city name injected) */
  metaDescriptionTemplate: string;
  /** FAQs for schema */
  faqs: Array<{ q: string; a: string }>;
}

export const SERVICE_LANDINGS: ServiceLanding[] = [
  {
    slug: "locticians",
    singular: "loctician",
    plural: "locticians",
    categorySlugs: ["locs"],
    metaDescriptionTemplate:
      "Find locticians in {city}. Browse verified loc specialists offering retwists, starter locs, interlocks, and loc repairs. Check availability and book on Krowned.",
    faqs: [
      {
        q: "How much does a loc retwist cost in {city}?",
        a: "Loc retwist prices vary by length and technique. On Krowned, you can compare pricing from verified locticians and book directly.",
      },
      {
        q: "How do I find a good loctician near me?",
        a: "Browse loctician profiles on Krowned to see their specialties, reviews from real clients, and portfolio photos. Filter by location and availability.",
      },
      {
        q: "How often should I get my locs retwisted?",
        a: "Most locticians recommend retwisting every 4-6 weeks, depending on your hair texture and loc maturity. Your stylist can advise on the best schedule.",
      },
      {
        q: "Do locticians on Krowned accept walk-ins?",
        a: "Most stylists on Krowned work by appointment. You can see real-time availability and book a time that works for you.",
      },
    ],
  },
  {
    slug: "braiders",
    singular: "braider",
    plural: "braiders",
    categorySlugs: ["braids-protective"],
    metaDescriptionTemplate:
      "Find braiders in {city}. Browse verified braiding specialists offering knotless braids, box braids, cornrows, and protective styles. Book on Krowned.",
    faqs: [
      {
        q: "How much do knotless braids cost in {city}?",
        a: "Knotless braid prices depend on size (small, medium, large, jumbo) and length. Browse braiders on Krowned to compare pricing and book.",
      },
      {
        q: "How long do braids last?",
        a: "Most protective braiding styles last 4-8 weeks with proper care. Your braider can recommend maintenance tips during your appointment.",
      },
      {
        q: "How do I find a braider near me?",
        a: "On Krowned, you can browse verified braiders by location, see their portfolio and reviews, check real-time availability, and book online.",
      },
      {
        q: "Should I wash my hair before getting braids?",
        a: "Yes, most braiders prefer you come with clean, detangled, and blow-dried hair. Check with your stylist for their specific prep instructions.",
      },
    ],
  },
  {
    slug: "barbers",
    singular: "barber",
    plural: "barbers",
    categorySlugs: ["barbering-cuts"],
    metaDescriptionTemplate:
      "Find barbers in {city}. Browse verified barbers offering fades, tapers, line-ups, and beard trims for all textures. Book on Krowned.",
    faqs: [
      {
        q: "How much does a fade cost in {city}?",
        a: "Fade prices vary by barber and complexity. On Krowned, you can compare pricing from verified barbers and book the one that fits your budget.",
      },
      {
        q: "How often should I get a haircut?",
        a: "For a sharp look, most barbers recommend a cut every 2-3 weeks. Tapers and fades grow out faster and may need more frequent visits.",
      },
      {
        q: "How do I find a barber who knows textured hair?",
        a: "Krowned specializes in textured-hair professionals. Every barber on the platform is verified and experienced with all hair textures.",
      },
      {
        q: "Can I book a barber online on Krowned?",
        a: "Yes! Browse barber profiles, check real-time availability, and book your appointment online. Some barbers also accept walk-ins.",
      },
    ],
  },
  {
    slug: "hair-extensions",
    singular: "hair extension specialist",
    plural: "hair extension specialists",
    categorySlugs: ["weaves-extensions"],
    metaDescriptionTemplate:
      "Find hair extension specialists in {city}. Browse verified stylists offering sew-ins, frontals, tape-ins, and wig installs. Book on Krowned.",
    faqs: [
      {
        q: "How much do sew-in extensions cost in {city}?",
        a: "Sew-in prices depend on the type (closure, frontal, full sew-in) and whether hair is included. Browse stylists on Krowned to compare pricing.",
      },
      {
        q: "How long do sew-in extensions last?",
        a: "A well-installed sew-in typically lasts 6-8 weeks. Your stylist will advise on maintenance and when to come back for removal or reinstall.",
      },
      {
        q: "What's the difference between a closure and a frontal?",
        a: "A closure covers a small section (4x4 or 5x5) while a frontal covers ear to ear (13x4 or 13x6). Frontals offer more styling versatility.",
      },
      {
        q: "How do I find a good extension specialist near me?",
        a: "Browse extension specialist profiles on Krowned to see reviews, portfolio photos, and pricing. Filter by location and book online.",
      },
    ],
  },
];

/** Get a service landing by slug */
export function getServiceLanding(slug: string): ServiceLanding | undefined {
  return SERVICE_LANDINGS.find((s) => s.slug === slug);
}

/** Generate static params for all service-type × city combos */
export function getServiceLandingCities(): Array<{ service: string; city: string }> {
  const params: Array<{ service: string; city: string }> = [];
  for (const landing of SERVICE_LANDINGS) {
    for (const citySlug of Object.keys(CITY_PAGES)) {
      params.push({ service: landing.slug, city: citySlug });
    }
  }
  return params;
}

/** Replace {city} placeholder in FAQ text */
export function interpolateFaqs(
  faqs: Array<{ q: string; a: string }>,
  cityName: string,
): Array<{ q: string; a: string }> {
  return faqs.map((f) => ({
    q: f.q.replace(/\{city\}/g, cityName),
    a: f.a.replace(/\{city\}/g, cityName),
  }));
}
