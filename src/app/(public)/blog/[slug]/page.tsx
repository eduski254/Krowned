import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { BlogComments } from "./blog-comments";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, meta_title, meta_description, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return { title: "Post Not Found | Krowned" };

  return {
    title: `${post.meta_title || post.title} | Krowned Blog`,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select(
      "*, author:author_id(full_name, avatar_url)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  // Get comments with user info
  const { data: comments } = await supabase
    .from("blog_comments")
    .select("id, body, created_at, user_id, user:user_id(full_name, avatar_url)")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Get related posts (same tags, exclude current)
  const { data: relatedPosts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, cover_image_url, excerpt, published_at, tags")
    .eq("status", "published")
    .neq("id", post.id)
    .overlaps("tags", post.tags ?? [])
    .order("published_at", { ascending: false })
    .limit(3);

  const authorProfile = post.author as unknown as { full_name: string; avatar_url: string | null } | null;
  const authorName = post.author_name || authorProfile?.full_name || "Krowned Team";
  const authorAvatar = post.author_avatar_url || authorProfile?.avatar_url || null;
  const authorBio = post.author_bio || null;

  const wordCount = (post.body ?? "").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const commentRows = (comments ?? []).map((c) => {
    const u = c.user as unknown as { full_name: string; avatar_url: string | null } | null;
    return {
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user_id: c.user_id,
      user_name: u?.full_name || "Anonymous",
      user_avatar: u?.avatar_url || null,
    };
  });

  return (
    <article>
      {/* Hero cover image */}
      {post.cover_image_url ? (
        <div className="relative w-full">
          {/* Back link - overlaid on hero */}
          <div className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>

          {/* Image with gradient overlay */}
          <div className="relative aspect-[21/9] min-h-[280px] max-h-[480px] w-full overflow-hidden sm:min-h-[320px]">
            <img
              src={post.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
            {/* Bottom gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Title overlay on the hero */}
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
              {/* Tags */}
              {(post.tags as string[])?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {(post.tags as string[]).slice(0, 4).map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white capitalize backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-2xl font-bold font-heading text-white sm:text-3xl lg:text-5xl leading-tight drop-shadow-lg">
                {post.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
                <div className="flex items-center gap-1.5">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-white/30" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-white/30">
                      {authorName.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-white">{authorName}</span>
                </div>
                <span className="text-white/40">|</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {publishedDate}
                </div>
                <span className="text-white/40">|</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime} min read
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No cover image fallback */
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {(post.tags as string[])?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(post.tags as string[]).map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize hover:bg-primary/20 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold font-heading text-foreground sm:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-3">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {authorName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{authorName}</p>
                {authorBio && <p className="text-xs text-muted-foreground">{authorBio}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {publishedDate}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime} min read
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Author bar (shown below hero when cover exists) */}
        {post.cover_image_url && (authorBio || true) && (
          <div className="mt-8 flex items-center gap-3 border-b border-border pb-6">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {authorName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{authorName}</p>
              {authorBio && <p className="text-xs text-muted-foreground">{authorBio}</p>}
            </div>
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mt-8 prose-headings:font-heading prose-a:text-primary prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Comments */}
        <div className="mt-12 border-t border-border pt-8">
          <BlogComments
            postId={post.id}
            comments={commentRows}
            currentUserId={user?.id ?? null}
            isLoggedIn={!!user}
          />
        </div>

        {/* Related posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-12 border-t border-border pt-8 pb-12">
            <h2 className="mb-6 text-2xl font-bold font-heading text-foreground">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {rp.cover_image_url ? (
                      <img
                        src={rp.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-hero">
                        <span className="text-2xl font-bold text-white/80 font-heading">
                          {rp.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
