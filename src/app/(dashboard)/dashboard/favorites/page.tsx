import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Heart } from "lucide-react";
import Link from "next/link";

export default async function ClientFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("business_id, businesses(id, name, slug, logo_url, city, country)")
    .eq("client_id", user.id)
    .limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Favorites</h1>

      {favorites && favorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => {
            const biz = f.businesses as unknown as {
              id: string;
              name: string;
              slug: string;
              logo_url: string | null;
              city: string | null;
              country: string | null;
            } | null;
            if (!biz) return null;
            return (
              <Link
                key={biz.id}
                href={`/b/${biz.slug}`}
                className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {biz.logo_url ? (
                    <img
                      src={biz.logo_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      {biz.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {biz.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[biz.city, biz.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Save businesses you love and they'll appear here for quick access."
          action={
            <Link
              href="/explore"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Explore businesses
            </Link>
          }
        />
      )}
    </div>
  );
}
