"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { resolveCardImage } from "./utils";

const boundsSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
  q: z.string().optional(),
  category: z.string().optional(),
});

export type ExploreBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  imageUrl: string | null;
  city: string | null;
  country: string | null;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  avgRating: number | null;
  reviewCount: number;
  isFavorited: boolean;
  serviceNames?: string[];
};


export async function searchByBounds(input: z.infer<typeof boundsSchema>) {
  const parsed = boundsSchema.safeParse(input);
  if (!parsed.success) return { businesses: [] as ExploreBusiness[] };

  const { north, south, east, west, q, category } = parsed.data;
  const supabase = await createClient();

  let query = supabase
    .from("businesses")
    .select(
      "id, name, slug, description, logo_url, cover_url, gallery, city, country, is_featured, latitude, longitude, primary_category_id, service_categories(name, slug)",
    )
    .eq("is_published", true)
    .eq("verification_status", "verified")
    .gte("latitude", south)
    .lte("latitude", north)
    .gte("longitude", west)
    .lte("longitude", east)
    .order("is_featured", { ascending: false });

  if (q) query = query.ilike("name", `%${q}%`);

  if (category) {
    const { data: cats } = await supabase
      .from("service_categories")
      .select("id")
      .eq("slug", category)
      .maybeSingle();
    if (cats) query = query.eq("primary_category_id", cats.id);
  }

  const { data: businesses } = await query.limit(100);

  // Reviews
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

  // Favorites
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favSet = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("business_id")
      .eq("client_id", user.id);
    favs?.forEach((f) => favSet.add(f.business_id));
  }

  const result: ExploreBusiness[] = (businesses ?? []).map((biz) => {
    const stats = ratingMap.get(biz.id);
    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      logo_url: biz.logo_url,
      cover_url: biz.cover_url,
      imageUrl: resolveCardImage(biz),
      city: biz.city,
      country: biz.country,
      is_featured: biz.is_featured,
      latitude: biz.latitude,
      longitude: biz.longitude,
      categoryName:
        (biz.service_categories as unknown as { name: string; slug: string } | null)?.name ??
        null,
      categorySlug:
        (biz.service_categories as unknown as { name: string; slug: string } | null)?.slug ??
        null,
      avgRating: stats ? stats.sum / stats.count : null,
      reviewCount: stats?.count ?? 0,
      isFavorited: favSet.has(biz.id),
    };
  });

  return { businesses: result };
}
