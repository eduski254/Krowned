import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, slug, icon, sort_order")
    .order("sort_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Service Categories
      </h1>

      <div className="space-y-2">
        {categories?.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {c.icon && <span className="text-lg">{c.icon}</span>}
              <div>
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">/c/{c.slug}</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              #{c.sort_order}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
