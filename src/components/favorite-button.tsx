"use client";

import { Heart } from "lucide-react";
import { useTransition, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toggleFavorite } from "@/lib/favorites/actions";

export function FavoriteButton({
  businessId,
  initialFavorited,
  isLoggedIn,
  size = "md",
}: {
  businessId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const [showTooltip, setShowTooltip] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; right: number } | null>(null);

  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  // Auto-hide tooltip + compute position
  useEffect(() => {
    if (!showTooltip) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        right: window.innerWidth - rect.right,
      });
    }
    const t = setTimeout(() => setShowTooltip(false), 2500);
    return () => clearTimeout(t);
  }, [showTooltip]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isLoggedIn) {
        setShowTooltip(true);
        return;
      }

      // Optimistic update
      setFavorited((prev) => !prev);

      startTransition(async () => {
        const result = await toggleFavorite(businessId);
        if (result.error) {
          setFavorited((prev) => !prev);
        }
      });
    },
    [businessId, isLoggedIn],
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        className={`${sizeClasses} inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          favorited
            ? "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
            : "bg-background/80 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <Heart
          className={`${iconSize} transition-transform ${favorited ? "fill-current scale-110" : ""} ${isPending ? "" : "group-hover:scale-110"}`}
        />
      </button>

      {showTooltip &&
        tooltipPos &&
        createPortal(
          <div
            className="fixed z-[100] animate-fade-in rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg"
            style={{
              top: tooltipPos.top,
              right: tooltipPos.right,
              transform: "translateY(-100%)",
            }}
          >
            Log in to save favorites
            <div className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-foreground" />
          </div>,
          document.body,
        )}
    </>
  );
}
