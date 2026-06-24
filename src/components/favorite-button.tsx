"use client";

import { Heart } from "lucide-react";
import { useTransition, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isLoggedIn) {
        router.push("/login?message=" + encodeURIComponent("Sign in to save your favorite businesses."));
        return;
      }

      // Optimistic update
      setFavorited((prev) => !prev);

      startTransition(async () => {
        const result = await toggleFavorite(businessId);
        if (result.error) {
          // Revert on error
          setFavorited((prev) => !prev);
          if (result.error === "not_authenticated") {
            router.push("/login");
          }
        }
      });
    },
    [businessId, isLoggedIn, router],
  );

  return (
    <button
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
  );
}
