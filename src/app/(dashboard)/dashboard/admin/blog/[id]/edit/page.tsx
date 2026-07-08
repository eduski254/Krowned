import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { BlogEditor } from "../../blog-editor";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold font-heading text-foreground">Edit Post</h1>
      <div className="max-w-4xl">
        <BlogEditor
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            body: post.body,
            cover_image_url: post.cover_image_url,
            author_name: post.author_name,
            author_bio: post.author_bio,
            author_avatar_url: post.author_avatar_url,
            status: post.status,
            tags: post.tags as string[],
            meta_title: post.meta_title,
            meta_description: post.meta_description,
          }}
        />
      </div>
    </div>
  );
}
