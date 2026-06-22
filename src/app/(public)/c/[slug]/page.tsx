import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("service_categories")
    .select("id, name, slug, icon")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, logo_url, city, country, description, is_featured")
    .eq("primary_category_id", category.id)
    .eq("is_published", true)
    .eq("verification_status", "verified")
    .order("is_featured", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        {category.icon && <span className="text-4xl">{category.icon}</span>}
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          {category.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Browse {category.name.toLowerCase()} professionals near you.
        </p>
      </div>

      {businesses && businesses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/b/${biz.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                {biz.logo_url ? (
                  <img src={biz.logo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                    {biz.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                      {biz.name}
                    </h3>
                    {biz.is_featured && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[biz.city, biz.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              {biz.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {biz.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            No businesses in this category yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon or explore other categories.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Explore all
          </Link>
        </div>
      )}
    </div>
  );
}
