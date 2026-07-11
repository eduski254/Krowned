"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { SocialLinksBar } from "@/components/social-icons";

type BusinessDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  social_links: Record<string, string> | null;
  booking_link_token: string | null;
  categoryName: string | null;
  avgRating: number | null;
  reviewCount: number;
  bookable: boolean;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price_amount: number;
    currency: string | null;
    duration_minutes: number;
    payment_option: string;
  }>;
  staff: Array<{
    id: string;
    display_name: string | null;
    title: string | null;
    avatar_url: string | null;
  }>;
  hours: Array<{ day: string; hours: string; isOpen: boolean }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewerName: string;
    avatarUrl: string | null;
  }>;
};

export function BusinessPreview({
  slug,
  imageUrl,
  onClose,
}: {
  slug: string;
  imageUrl: string | null;
  onClose: () => void;
}) {
  const [biz, setBiz] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/businesses/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setBiz(data.error ? null : data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Slide-in panel */}
      <div className="relative flex h-full w-full max-w-lg flex-col bg-card shadow-2xl sm:max-w-xl md:max-w-2xl animate-slide-in-right">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !biz ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Business not found.</p>
            </div>
          ) : (
            <>
              {/* Cover image */}
              <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
                {imageUrl || biz.cover_url ? (
                  <img
                    src={(imageUrl || biz.cover_url)!}
                    alt={biz.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-5xl font-bold text-primary">
                    {biz.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-10">
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    {biz.name}
                  </h2>
                  <p className="text-sm text-white/80">
                    {[biz.categoryName, biz.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {/* Quick info bar */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <StarRating
                  value={biz.avgRating}
                  count={biz.reviewCount}
                />
                <div className="flex items-center gap-2">
                  {biz.bookable && biz.booking_link_token && (
                    <Link
                      href={`/book/${biz.booking_link_token}?source=marketplace`}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Book Now
                    </Link>
                  )}
                  <Link
                    href={`/b/${biz.slug}`}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Full Profile
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="space-y-6 px-5 py-5">
                {/* Description */}
                {biz.description && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {biz.description}
                  </p>
                )}

                {/* Services */}
                {biz.services.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Services
                    </h3>
                    <div className="space-y-2">
                      {biz.services.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {s.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {s.duration_minutes}min
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">
                              {(s.price_amount / 100).toLocaleString()}{" "}
                              <span className="text-xs text-muted-foreground">
                                {s.currency?.toUpperCase()}
                              </span>
                            </span>
                            {biz.bookable && biz.booking_link_token && (
                              <Link
                                href={`/book/${biz.booking_link_token}?source=marketplace&service=${s.id}`}
                                className="rounded-md border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                Book
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Staff */}
                {biz.staff.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Team
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {biz.staff.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                        >
                          {s.avatar_url ? (
                            <img
                              src={s.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(s.display_name ?? "?").charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {s.display_name}
                            </p>
                            {s.title && (
                              <p className="text-xs text-muted-foreground">
                                {s.title}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Contact & Hours — side by side */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Contact */}
                  <section className="rounded-lg border border-border bg-background p-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      {biz.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            {biz.address}
                            {biz.city && `, ${biz.city}`}
                          </span>
                        </div>
                      )}
                      {biz.phone && (
                        <a href={`tel:${biz.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{biz.phone}</span>
                        </a>
                      )}
                      {biz.email && (
                        <a href={`mailto:${biz.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span>{biz.email}</span>
                        </a>
                      )}
                      {biz.social_links && Object.values(biz.social_links).some(Boolean) && (
                        <SocialLinksBar socialLinks={biz.social_links} className="mt-1" />
                      )}
                    </div>
                  </section>

                  {/* Hours */}
                  <section className="rounded-lg border border-border bg-background p-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Hours
                    </h3>
                    <div className="space-y-0.5">
                      {biz.hours.map((h) => (
                        <div
                          key={h.day}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {h.day}
                          </span>
                          <span
                            className={
                              h.isOpen
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {h.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Reviews */}
                {biz.reviews.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Reviews
                    </h3>
                    <div className="space-y-3">
                      {biz.reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-lg border border-border bg-background p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {r.avatarUrl ? (
                                <img
                                  src={r.avatarUrl}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {r.reviewerName.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm font-medium text-foreground">
                                {r.reviewerName}
                              </span>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < r.rating
                                      ? "fill-warning text-warning"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {r.comment && (
                            <p className="mt-1.5 text-sm text-foreground">
                              {r.comment}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
