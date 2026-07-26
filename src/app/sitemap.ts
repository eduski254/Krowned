import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // City landing pages
  const cityPageSlugs = [
    "washington-dc",
    "silver-spring-md",
    "bowie-md",
    "hyattsville-md",
    "largo-md",
    "bethesda-md",
    "alexandria-va",
    "arlington-va",
    "fairfax-va",
  ];
  const cityPages: MetadataRoute.Sitemap = cityPageSlugs.map((slug) => ({
    url: `${SITE_URL}/explore/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

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
    ...cityPages,
    ...businessPages,
    ...blogPages,
  ];
}
