"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BusinessPreview } from "@/app/(public)/explore/business-preview";

export type FavoriteBusiness = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  country: string | null;
};

export function FavoritesClient({
  favorites,
}: {
  favorites: FavoriteBusiness[];
}) {
  const [preview, setPreview] = useState<FavoriteBusiness | null>(null);

  if (favorites.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((biz) => (
          <button
            key={biz.id}
            type="button"
            onClick={() => setPreview(biz)}
            className="group rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-md"
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
          </button>
        ))}
      </div>

      {preview && (
        <BusinessPreview
          biz={{
            id: preview.id,
            name: preview.name,
            slug: preview.slug,
            description: null,
            logo_url: preview.logo_url,
            cover_url: preview.cover_url,
            imageUrl: preview.cover_url,
            city: preview.city,
            country: preview.country,
            is_featured: false,
            latitude: null,
            longitude: null,
            categoryName: null,
            categorySlug: null,
            avgRating: null,
            reviewCount: 0,
            isFavorited: true,
            badges: [],
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
