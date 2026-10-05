import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { STYLE_PAGES } from "@/lib/styles-data";
import { CITY_SLUGS, CITY_PAGES } from "@/lib/cities-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  // Fetch dynamic data in parallel
  const [businessesRes, categoriesRes, blogPostsRes] = await Promise.all([
    admin
      .from("businesses")
      .select("slug, updated_at")
      .eq("is_published", true)
      .eq("verification_status", "verified"),
    admin.from("service_categories").select("slug").order("sort_order"),
    admin
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published"),
  ]);

  const businesses = businessesRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const blogPosts = blogPostsRes.data ?? [];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${SITE_URL}/explore`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/for-stylists`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/for-professionals`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${SITE_URL}/our-story`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/styles`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/cookie-policy`,
      changeFrequency: "yearly",
      priority: 0.1,
    },
    {
      url: `${SITE_URL}/cancellation-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/stylist-terms`,
      changeFrequency: "yearly",
      priority: 0.1,
    },
    {
      url: `${SITE_URL}/community-guidelines`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/accessibility`,
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];

  // Category style pages (canonical landing pages)
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/styles/${cat.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Style sub-pages (e.g. /styles/braids-protective/knotless-braids)
  const styleSubPages: MetadataRoute.Sitemap = STYLE_PAGES.map((s) => ({
    url: `${SITE_URL}/styles/${s.categorySlug}/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // City landing pages
  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/explore/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Style × city pages — only include combos with ≥3 listings
  const styleCityPages: MetadataRoute.Sitemap = [];
  {
    // Build a map of category_id → category_slug
    const catSlugToId = new Map<string, string>();
    for (const cat of categories) {
      catSlugToId.set(cat.slug, cat.slug); // we only have slug from the query
    }

    // Fetch business counts per city+category for all published businesses
    const { data: allBiz } = await admin
      .from("businesses")
      .select("city, service_categories!inner(slug)")
      .eq("is_published", true)
      .eq("verification_status", "verified");

    // Count per (city, catSlug) pair
    const countMap = new Map<string, number>();
    for (const b of allBiz ?? []) {
      const catSlug = (b.service_categories as unknown as { slug: string })
        ?.slug;
      const city = b.city as string;
      if (!catSlug || !city) continue;
      const key = `${city}|${catSlug}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    for (const citySlug of CITY_SLUGS) {
      const cityData = CITY_PAGES[citySlug];
      if (!cityData) continue;
      for (const style of STYLE_PAGES) {
        // Sum counts across all dbMatches for this city
        let total = 0;
        for (const dbCity of cityData.dbMatches) {
          total += countMap.get(`${dbCity}|${style.categorySlug}`) ?? 0;
        }
        if (total >= 3) {
          styleCityPages.push({
            url: `${SITE_URL}/explore/${citySlug}/${style.slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          });
        }
      }
    }
  }

  // Business profile pages
  const businessPages: MetadataRoute.Sitemap = businesses.map((biz) => ({
    url: `${SITE_URL}/b/${biz.slug}`,
    lastModified: biz.updated_at ? new Date(biz.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...styleSubPages,
    ...cityPages,
    ...styleCityPages,
    ...businessPages,
    ...blogPages,
  ];
}
