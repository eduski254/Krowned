import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BlogPostsTable } from "./blog-posts-table";

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, tags, published_at, created_at, updated_at, author_id, author_name, author:author_id(full_name)")
    .order("created_at", { ascending: false });

  const rows = (posts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status as "draft" | "published",
    tags: p.tags as string[],
    published_at: p.published_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
    author_display: p.author_name || (p.author as unknown as { full_name: string } | null)?.full_name || "Unknown",
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-foreground">Blog Posts</h1>
        <Link
          href="/dashboard/admin/blog/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>
      <BlogPostsTable rows={rows} />
    </div>
  );
}
