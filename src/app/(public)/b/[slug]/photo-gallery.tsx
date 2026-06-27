"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function PhotoGallery({ photos }: { photos: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  const showLightbox = lightboxIdx !== null;

  useEffect(() => {
    if (!showLightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft" && lightboxIdx! > 0) setLightboxIdx(lightboxIdx! - 1);
      if (e.key === "ArrowRight" && lightboxIdx! < photos.length - 1) setLightboxIdx(lightboxIdx! + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showLightbox, lightboxIdx, photos.length]);

  return (
    <>
      {/* Carousel */}
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory"
        >
          {photos.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIdx(i)}
              className="shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl overflow-hidden"
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  target.parentElement?.classList.add("bg-muted", "flex", "items-center", "justify-center");
                  const span = document.createElement("span");
                  span.className = "text-xs text-muted-foreground";
                  span.textContent = "Image unavailable";
                  target.parentElement?.appendChild(span);
                }}
                className="h-48 w-72 object-cover rounded-xl sm:h-56 sm:w-80 hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>

        {/* Arrow controls */}
        {photos.length > 2 && (
          <>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute right-4 top-4 rounded-full bg-background/20 p-2 text-white hover:bg-background/40"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-white hover:bg-background/40"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            src={photos[lightboxIdx]}
            alt={`Photo ${lightboxIdx + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIdx < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-white hover:bg-background/40"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {lightboxIdx + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
