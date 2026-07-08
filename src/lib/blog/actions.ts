"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";

// ---------- Schemas ----------

const PostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().optional(),
  body: z.string(),
  cover_image_url: z.string().optional(),
  author_name: z.string().optional(),
  author_bio: z.string().optional(),
  author_avatar_url: z.string().optional(),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

// ---------- Types ----------

export type PostFormState = {
  success?: boolean;
  error?: string;
  postId?: string;
} | null;

// ---------- Admin: Create/Update Post ----------

export async function upsertPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") return { error: "Unauthorized" };

  const tagsRaw = formData.get("tags") as string;
  const raw = {
    id: (formData.get("id") as string) || undefined,
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    body: formData.get("body") as string,
    cover_image_url: (formData.get("cover_image_url") as string) || undefined,
    author_name: (formData.get("author_name") as string) || undefined,
    author_bio: (formData.get("author_bio") as string) || undefined,
    author_avatar_url: (formData.get("author_avatar_url") as string) || undefined,
    status: formData.get("status") as string,
    tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    meta_title: (formData.get("meta_title") as string) || undefined,
    meta_description: (formData.get("meta_description") as string) || undefined,
  };

  const parsed = PostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const admin = createAdminClient();
  const data = parsed.data;

  if (data.id) {
    // Update
    const updatePayload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      body: data.body,
      cover_image_url: data.cover_image_url || null,
      author_name: data.author_name || null,
      author_bio: data.author_bio || null,
      author_avatar_url: data.author_avatar_url || null,
      status: data.status,
      tags: data.tags,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
    };

    // Set published_at if publishing for the first time
    if (data.status === "published") {
      const { data: existing } = await admin
        .from("blog_posts")
        .select("published_at")
        .eq("id", data.id)
        .single();
      if (!existing?.published_at) {
        updatePayload.published_at = new Date().toISOString();
      }
    }

    const { error } = await admin
      .from("blog_posts")
      .update(updatePayload)
      .eq("id", data.id);

    if (error) return { error: error.message };
    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");
    return { success: true, postId: data.id };
  } else {
    // Create
    const insertPayload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      body: data.body,
      cover_image_url: data.cover_image_url || null,
      author_id: user.id,
      author_name: data.author_name || null,
      author_bio: data.author_bio || null,
      author_avatar_url: data.author_avatar_url || null,
      status: data.status,
      tags: data.tags,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
    };

    if (data.status === "published") {
      insertPayload.published_at = new Date().toISOString();
    }

    const { data: newPost, error } = await admin
      .from("blog_posts")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");
    return { success: true, postId: newPost.id };
  }
}

// ---------- Admin: Delete Post ----------

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") return { error: "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/blog");
  revalidatePath("/dashboard/admin/blog");
  return {};
}

// ---------- Public: Add Comment ----------

export async function addComment(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to comment" };

  const raw = {
    post_id: formData.get("post_id") as string,
    body: formData.get("body") as string,
  };

  const parsed = CommentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("blog_comments").insert({
    post_id: parsed.data.post_id,
    user_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };
  revalidatePath(`/blog`);
  return { success: true };
}

// ---------- Public: Delete Comment ----------

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // RLS will enforce that only the comment owner or admin can delete
  const { error } = await supabase.from("blog_comments").delete().eq("id", commentId);
  if (error) return { error: error.message };

  revalidatePath("/blog");
  return {};
}
