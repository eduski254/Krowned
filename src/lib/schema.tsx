/**
 * JSON-LD structured data helpers for SEO.
 * Renders as <script type="application/ld+json"> via Next.js.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

/** Render a JSON-LD script tag. Use inside a server component's JSX. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization schema for the homepage */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Krowned",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-black.png`,
    description:
      "Krowned is a booking marketplace for textured-hair professionals — braiders, loc techs, natural-hair stylists, and barbers — in the Washington DC, Maryland, and Northern Virginia (DMV) area. Clients discover verified stylists, book real time slots, and pay online. Not a hair-care product brand.",
    foundingDate: "2026",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 38.9072,
        longitude: -77.0369,
      },
      geoRadius: "80km",
    },
    sameAs: [
      "https://www.instagram.com/kraborowned",
      "https://www.tiktok.com/@krowned.app",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@krowned.app",
    },
  };
}

/** WebSite schema with search action */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Krowned",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** LocalBusiness schema for a stylist profile page */
export function localBusinessSchema(biz: {
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryName?: string | null;
  avgRating?: number | null;
  reviewCount?: number;
  reviews?: Array<{
    rating: number;
    comment?: string | null;
    authorName: string;
    datePublished: string;
  }>;
  services?: Array<{
    name: string;
    description?: string | null;
    priceAmount: number;
    currency: string;
  }>;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: biz.name,
    url: `${SITE_URL}/b/${biz.slug}`,
    description: biz.description || `${biz.name} — textured-hair stylist on Krowned`,
  };

  if (biz.logo_url) schema.logo = biz.logo_url;
  if (biz.cover_url) schema.image = biz.cover_url;
  if (biz.phone) schema.telephone = biz.phone;
  if (biz.email) schema.email = biz.email;

  if (biz.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: biz.address,
      addressLocality: biz.city || undefined,
      addressCountry: biz.country || "US",
    };
  } else if (biz.city) {
    schema.areaServed = {
      "@type": "City",
      name: biz.city,
    };
  }

  if (biz.latitude && biz.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: biz.latitude,
      longitude: biz.longitude,
    };
  }

  // Price range from services
  if (biz.services && biz.services.length > 0) {
    const prices = biz.services.map((s) => s.priceAmount / 100);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    schema.priceRange = min === max ? `$${min}` : `$${min} - $${max}`;

    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: biz.services.slice(0, 10).map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.description || undefined,
        },
        price: (s.priceAmount / 100).toFixed(2),
        priceCurrency: s.currency?.toUpperCase() || "USD",
      })),
    };
  }

  // Aggregate rating
  if (biz.avgRating && biz.reviewCount && biz.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: biz.avgRating.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      reviewCount: biz.reviewCount,
    };
  }

  // Individual reviews (up to 5 for schema)
  if (biz.reviews && biz.reviews.length > 0) {
    schema.review = biz.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5",
      },
      author: {
        "@type": "Person",
        name: r.authorName,
      },
      reviewBody: r.comment || undefined,
      datePublished: r.datePublished,
    }));
  }

  return schema;
}

/** FAQPage schema */
export function faqPageSchema(
  faqs: Array<{ q: string; a: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/** BreadcrumbList schema */
export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
