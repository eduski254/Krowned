import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-destructive">Access denied</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only super admins can manage categories.
        </p>
      </div>
    );
  }

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, slug, icon, sort_order")
    .order("sort_order");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, rename, reorder, and manage icons for the public category taxonomy.
          </p>
        </div>
      </div>
      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
