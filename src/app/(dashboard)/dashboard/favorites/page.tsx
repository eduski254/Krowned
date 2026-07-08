import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FavoritesClient, type FavoriteBusiness } from "./favorites-client";

export default async function ClientFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "business_id, businesses(id, name, slug, logo_url, cover_url, city, country)",
    )
    .eq("client_id", user.id)
    .limit(50);

  const businesses: FavoriteBusiness[] = (favorites ?? [])
    .map((f) => {
      const biz = f.businesses as unknown as FavoriteBusiness | null;
      return biz;
    })
    .filter((b): b is FavoriteBusiness => b !== null);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Favorites</h1>
      <FavoritesClient favorites={businesses} />
    </div>
  );
}
