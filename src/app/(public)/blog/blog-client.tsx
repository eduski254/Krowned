"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Calendar } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  author_name: string;
  author_avatar: string | null;
  reading_time: number;
};

export function BlogGrid({
  posts,
  allTags,
}: {
  posts: BlogPost[];
  allTags: string[];
}) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.excerpt ?? "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, search, activeTag]);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Search + Tags */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-full border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !activeTag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  activeTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">No articles found</p>
          <p className="mt-1 text-sm">Try a different search or tag</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5 animate-card-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Cover */}
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-hero">
                    <span className="text-3xl font-bold text-white/80 font-heading">
                      {post.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-lg font-bold font-heading text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
                  {/* Author */}
                  <div className="flex items-center gap-1.5">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                        {post.author_name.charAt(0)}
                      </div>
                    )}
                    <span>{post.author_name}</span>
                  </div>
                  <span className="text-border">|</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.published_at)}
                  </div>
                  <span className="text-border">|</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time} min
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
