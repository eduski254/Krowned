import { createClient } from "@/lib/supabase/server";
import { BlogGrid } from "./blog-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Krown",
  description: "Tips, trends, and insights on beauty, wellness, and self-care from the Krown team.",
};

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image_url, tags, published_at, author_name, author_avatar_url, author_id, author:author_id(full_name, avatar_url), body"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const serialized = (posts ?? []).map((p) => {
    const authorProfile = p.author as unknown as { full_name: string; avatar_url: string | null } | null;
    const wordCount = (p.body ?? "").split(/\s+/).filter(Boolean).length;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      cover_image_url: p.cover_image_url,
      tags: (p.tags ?? []) as string[],
      published_at: p.published_at,
      author_name: p.author_name || authorProfile?.full_name || "Krown Team",
      author_avatar: p.author_avatar_url || authorProfile?.avatar_url || null,
      reading_time: Math.max(1, Math.ceil(wordCount / 200)),
    };
  });

  // Collect all unique tags
  const allTags = Array.from(new Set(serialized.flatMap((p) => p.tags))).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold font-heading text-foreground sm:text-5xl">
          The Krown Blog
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Tips, trends, and insights on beauty, wellness, and self-care.
        </p>
      </div>

      <BlogGrid posts={serialized} allTags={allTags} />
    </div>
  );
}
