import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BlogEditor } from "../blog-editor";

export default async function NewBlogPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold font-heading text-foreground">New Blog Post</h1>
      <div className="max-w-4xl">
        <BlogEditor />
      </div>
    </div>
  );
}
