import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense, lazy } from "react";
import { Star, Clock, MapPin, Phone, Mail, Home } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { PhotoGallery } from "./photo-gallery";

const BusinessMiniMap = lazy(() =>
  import("./business-mini-map").then((m) => ({ default: m.BusinessMiniMap })),
);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*, service_categories(name), plans(tier, features)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!business) notFound();

  // Fetch services, staff, hours, reviews in parallel
  const [servicesRes, staffRes, hoursRes, reviewsRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, price_amount, currency, duration_minutes, payment_option")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("staff")
      .select("id, display_name, title, bio, avatar_url")
      .eq("business_id", business.id)
      .eq("status", "active"),
    supabase
      .from("business_hours")
      .select("day_of_week, open_time, close_time")
      .eq("business_id", business.id)
      .order("day_of_week"),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, clients:client_id(full_name)")
      .eq("business_id", business.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const services = servicesRes.data ?? [];
  const staff = staffRes.data ?? [];
  const hours = hoursRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const plan = business.plans as unknown as { tier: string; features: Record<string, unknown> } | null;
  const isBookable = plan?.tier === "premium" && ["trialing", "active"].includes(business.subscription_status ?? "");

  const hasCoords =
    business.latitude != null &&
    business.longitude != null &&
    (business.latitude !== 0 || business.longitude !== 0);
  const hasMapKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const galleryPhotos = (business.gallery as string[] | null) ?? [];

  // Check if current user has favorited this business
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isFavorited = false;
  if (user) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("client_id", user.id)
      .eq("business_id", business.id)
      .maybeSingle();
    isFavorited = !!fav;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          {business.logo_url ? (
            <img src={business.logo_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary">
              {business.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {business.name}
              </h1>
              <FavoriteButton
                businessId={business.id}
                initialFavorited={isFavorited}
                isLoggedIn={!!user}
              />
            </div>
            <p className="text-muted-foreground">
              {(business.service_categories as unknown as { name: string } | null)?.name}
              {business.city && ` — ${business.city}`}
            </p>
            {avgRating && (
              <div className="mt-1 flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="text-sm font-medium text-foreground">{avgRating}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            )}
          </div>
        </div>
        {isBookable && (
          <Link
            href={`/book/${business.booking_link_token}?source=marketplace`}
            className="self-start rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Book Now
          </Link>
        )}
      </div>

      {/* Description */}
      {business.description && (
        <p className="mt-6 text-foreground">{business.description}</p>
      )}

      {/* Photo Gallery */}
      {galleryPhotos.length > 0 && (
        <section className="mt-6">
          {/* // REVIEW: When photo uploads are built, they should write URLs to business.gallery (jsonb array) */}
          <PhotoGallery photos={galleryPhotos} />
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Services */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Services</h2>
            {services.length > 0 ? (
              <div className="space-y-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.duration_minutes} min
                        </span>
                        <span>{s.payment_option}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {(s.price_amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.currency?.toUpperCase()}</p>
                      </div>
                      {isBookable && (
                        <Link
                          href={`/book/${business.booking_link_token}?source=marketplace&service=${s.id}`}
                          className="shrink-0 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          Book
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No services listed yet.</p>
            )}
          </section>

          {/* Staff */}
          {staff.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-foreground">Our Team</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {staff.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(s.display_name ?? "?").charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{s.display_name}</p>
                      {s.title && <p className="text-sm text-muted-foreground">{s.title}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {(r.clients as unknown as { full_name: string } | null)?.full_name ?? "Anonymous"}
                      </p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground">Contact</h3>
            <div className="mt-3 space-y-2 text-sm">
              {business.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{business.address}, {business.city}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{business.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hours */}
          {hours.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Business Hours</h3>
              <div className="mt-3 space-y-1">
                {hours.map((h) => (
                  <div key={h.day_of_week} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{DAY_NAMES[h.day_of_week]}</span>
                    <span className="text-foreground">
                      {h.open_time?.slice(0, 5)} — {h.close_time?.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {hasCoords && hasMapKey ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Location</h3>
              {business.address && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {[business.address, business.city, business.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              <div className="mt-3">
                <Suspense
                  fallback={
                    <div className="flex h-[250px] items-center justify-center rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Loading map...</p>
                    </div>
                  }
                >
                  <BusinessMiniMap
                    lat={business.latitude!}
                    lng={business.longitude!}
                    name={business.name}
                  />
                </Suspense>
              </div>
            </div>
          ) : !hasCoords ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Location</h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4 shrink-0" />
                <span>Mobile / At-home service</span>
              </div>
              {business.city && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Serving {[business.city, business.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
