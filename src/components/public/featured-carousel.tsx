"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight } from "lucide-react";

interface FeaturedBusiness {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  categoryName: string | null;
  city: string | null;
  country: string | null;
}

const AUTOPLAY_MS = 4000;
const SCROLL_AMOUNT = 296; // card width (280) + gap (16)

export function FeaturedCarousel({ businesses }: { businesses: FeaturedBusiness[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: "smooth" });
  }, []);

  // Update arrow visibility on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  // Autoplay
  useEffect(() => {
    if (isPaused || businesses.length <= 1) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
      }
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [isPaused, businesses.length]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-1)}
          className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-all hover:bg-muted hover:scale-110 active:scale-95"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(1)}
          className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-all hover:bg-muted hover:scale-110 active:scale-95"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      )}

      {/* Cards */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-4"
      >
        {businesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/b/${biz.slug}`}
            className="group w-[280px] shrink-0 overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              {biz.imageUrl ? (
                <img
                  src={biz.imageUrl}
                  alt={biz.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                  {biz.name.charAt(0)}
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Featured
              </span>
            </div>
            <div className="p-4">
              <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                {biz.name}
              </h3>
              {biz.categoryName && (
                <p className="mt-0.5 text-xs text-muted-foreground">{biz.categoryName}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[biz.city, biz.country].filter(Boolean).join(", ") || "—"}
                </p>
                <span className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowRight className="inline h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
