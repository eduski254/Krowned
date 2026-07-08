// Core scoring algorithm for client-side filtering + ranking
// Adapt the type and field names to your domain

type Listing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  city: string | null;
  country: string | null;
  is_featured: boolean;
  avgRating: number | null;
};

type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";
type HoursMap = Record<
  string,
  Array<{ day_of_week: number; open_time: string; close_time: string }>
>;

function filterAndRank(
  all: Listing[],
  q: string,
  city: string,
  categorySlug: string,
  whenDate: string | null,
  whenTime: TimeOfDay,
  hoursMap: HoursMap,
): Listing[] {
  const qLower = q.toLowerCase().trim();
  const cityLower = city.toLowerCase().trim();

  const scored = all.map((item) => {
    let score = 0;
    let passes = true;

    // --- Hard filters (exclude if no match) ---

    // Category
    if (categorySlug && item.categorySlug !== categorySlug) {
      passes = false;
    }

    // City (fuzzy includes)
    if (cityLower) {
      const itemCity = (item.city ?? "").toLowerCase();
      const itemCountry = (item.country ?? "").toLowerCase();
      if (itemCity.includes(cityLower) || itemCountry.includes(cityLower)) {
        score += 10;
      } else {
        passes = false;
      }
    }

    // When (date + time-of-day) — checks operating hours
    if (whenDate || whenTime !== "anytime") {
      const hours = hoursMap[item.id] ?? [];
      if (!isOpenAt(hours, whenDate, whenTime)) {
        passes = false;
      }
    }

    // --- Soft filter (ranking only) ---

    if (qLower) {
      const name = item.name.toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      const cat = (item.categoryName ?? "").toLowerCase();

      if (name === qLower) score += 100;        // exact match
      else if (name.startsWith(qLower)) score += 80;  // starts with
      else if (name.includes(qLower)) score += 50;    // contains
      else if (cat.includes(qLower)) score += 20;     // category match
      else if (desc.includes(qLower)) score += 10;    // description match
      else score -= 50;                                // no match penalty
    }

    // Boosts
    if (item.is_featured) score += 5;
    if (item.avgRating) score += item.avgRating;

    return { item, score, passes };
  });

  // Apply filters
  const hasHardFilter = !!categorySlug || !!cityLower || !!whenDate || whenTime !== "anytime";

  let results: typeof scored;
  if (hasHardFilter) {
    results = scored.filter((s) => s.passes);
  } else if (qLower) {
    // Text-only search: show matching results, fall back to all if nothing matches
    results = scored.filter((s) => s.score > -50);
    if (results.length === 0) results = scored;
  } else {
    results = scored;
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results.map((s) => s.item);
}

// --- Hours check utility ---

function isOpenAt(
  hours: Array<{ day_of_week: number; open_time: string; close_time: string }>,
  date: string | null,
  time: TimeOfDay,
): boolean {
  if (!date && time === "anytime") return true;
  if (hours.length === 0) return false;

  let dayOfWeek: number | null = null;
  if (date) {
    const d = new Date(date + "T00:00:00");
    dayOfWeek = d.getDay(); // 0=Sun
  }

  let candidates = hours;
  if (dayOfWeek !== null) {
    candidates = hours.filter((h) => h.day_of_week === dayOfWeek);
    if (candidates.length === 0) return false;
  }

  if (time === "anytime") return candidates.length > 0;

  const ranges: Record<string, [number, number]> = {
    morning: [6, 12],
    afternoon: [12, 17],
    evening: [17, 21],
  };
  const [start, end] = ranges[time];

  return candidates.some((h) => {
    const [oh, om] = h.open_time.split(":").map(Number);
    const [ch, cm] = h.close_time.split(":").map(Number);
    const openHour = oh + (om ?? 0) / 60;
    const closeHour = ch + (cm ?? 0) / 60;
    return openHour < end && closeHour > start;
  });
}
