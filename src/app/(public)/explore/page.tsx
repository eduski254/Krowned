import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search, MapPin, Star, Grid3X3, List } from "lucide-react";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, slug")
    .order("sort_order");

  // Build business query
  let query = supabase
    .from("businesses")
    .select(
      "id, name, slug, description, logo_url, city, country, is_featured, primary_category_id, service_categories(name)",
    )
    .eq("is_published", true)
    .eq("verification_status", "verified")
    .order("is_featured", { ascending: false });

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }
  if (params.category) {
    const matchingCat = categories?.find((c) => c.slug === params.category);
    if (matchingCat) {
      query = query.eq("primary_category_id", matchingCat.id);
    }
  }

  const { data: businesses } = await query.limit(50);

  // Get average ratings
  const { data: reviewStats } = await supabase
    .from("reviews")
    .select("business_id, rating")
    .eq("status", "published");

  const ratingMap = new Map<string, { sum: number; count: number }>();
  reviewStats?.forEach((r) => {
    const existing = ratingMap.get(r.business_id);
    if (existing) {
      existing.sum += r.rating;
      existing.count++;
    } else {
      ratingMap.set(r.business_id, { sum: r.rating, count: 1 });
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Explore Services
      </h1>
      <p className="mt-1 text-muted-foreground">
        Find and book beauty &amp; wellness services near you.
      </p>

      {/* Search + Filters */}
      <form className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            type="text"
            defaultValue={params.q ?? ""}
            placeholder="Search businesses..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <input
            name="city"
            type="text"
            defaultValue={params.city ?? ""}
            placeholder="City"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {/* Results */}
      <div className="mt-8">
        <p className="mb-4 text-sm text-muted-foreground">
          {businesses?.length ?? 0} result{(businesses?.length ?? 0) !== 1 ? "s" : ""}
        </p>

        {businesses && businesses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((biz) => {
              const stats = ratingMap.get(biz.id);
              const avg = stats ? (stats.sum / stats.count).toFixed(1) : null;
              return (
                <Link
                  key={biz.id}
                  href={`/b/${biz.slug}`}
                  className="group rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      {biz.logo_url ? (
                        <img
                          src={biz.logo_url}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                          {biz.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
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
                          {(biz.service_categories as unknown as { name: string } | null)?.name ?? ""}
                        </p>
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

                    {/* Rating + action */}
                    <div className="mt-4 flex items-center justify-between">
                      {avg ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-medium text-foreground">{avg}</span>
                          <span className="text-xs text-muted-foreground">
                            ({stats!.count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No reviews yet</span>
                      )}
                      <span className="text-sm font-medium text-primary">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">No businesses found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
