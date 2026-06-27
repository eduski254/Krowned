import { Star, StarHalf } from "lucide-react";

/**
 * Reusable star rating display.
 *
 * Partial-star logic:
 * - Full star: fractional part < 0.25
 * - Half star: fractional part >= 0.25 and < 0.75
 * - Empty star: fractional part >= 0.75 rounds up to next full
 *
 * e.g. 3.8 → 4 full, 0 half, 1 empty
 *      3.5 → 3 full, 1 half, 1 empty
 *      3.2 → 3 full, 0 half, 2 empty
 */
export function StarRating({
  value,
  count,
  size = "sm",
}: {
  value: number | null;
  count: number;
  size?: "sm" | "xs";
}) {
  const iconClass = size === "xs" ? "h-3 w-3" : "h-4 w-4";
  const textClass = size === "xs" ? "text-xs" : "text-sm";

  if (!value) {
    return (
      <div
        className="flex items-center gap-1"
        aria-label="No reviews yet"
        role="img"
      >
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`${iconClass} text-muted-foreground`} />
          ))}
        </div>
        <span className={`${textClass} text-muted-foreground`}>
          No reviews yet
        </span>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(5, value));
  const fraction = clamped % 1;
  let full: number;
  let half: boolean;

  if (fraction < 0.25) {
    full = Math.floor(clamped);
    half = false;
  } else if (fraction < 0.75) {
    full = Math.floor(clamped);
    half = true;
  } else {
    full = Math.ceil(clamped);
    half = false;
  }

  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5, ${count} review${count !== 1 ? "s" : ""}`}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star
            key={`f-${i}`}
            className={`${iconClass} fill-warning text-warning`}
          />
        ))}
        {half && (
          <StarHalf
            className={`${iconClass} fill-warning text-warning`}
          />
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`e-${i}`}
            className={`${iconClass} text-muted-foreground`}
          />
        ))}
      </div>
      <span className={`${textClass} font-medium text-foreground`}>
        {clamped.toFixed(1)}
      </span>
      <span className={`${textClass} text-muted-foreground`}>
        ({count} {count === 1 ? "Review" : "Reviews"})
      </span>
    </div>
  );
}
