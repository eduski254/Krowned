# Directory / Explore Page — Reusable Skill

A complete Booksy/Yelp-style directory page with instant search, map, and a hero search bar for landing pages. Built for Next.js App Router + any database (Supabase shown in references).

## When to use this skill

Use when building a directory, marketplace, or explore page where users browse, search, and filter listings (businesses, professionals, properties, restaurants, etc.).

## Architecture overview

```
Server Page (page.tsx)
  |-- Fetches ALL published listings + categories + services + hours + reviews
  |-- Serializes into a flat array of typed objects
  |-- Passes everything to a single client component
  v
Client Component (explore-client.tsx)
  |-- All filtering/ranking happens client-side via useMemo (instant, no server round-trips)
  |-- Hard filters: category, city, when (date+time) — exclude non-matches
  |-- Soft filters: search text — only reorders results by relevance score
  |-- Two-phase input: user types freely, filters apply on Enter (not on every keystroke)
  v
Shared Search Components (src/components/search/)
  |-- search-dropdown.tsx — service + listing suggestion dropdown
  |-- location-dropdown.tsx — browser geolocation + localStorage history
  |-- when-filter.tsx — calendar date picker + time-of-day selector
  v
Map Component (explore-map.tsx)
  |-- Lazy-loaded (React.lazy) to avoid SSR issues with window/google globals
  |-- SVG pin markers, marker clustering, InfoWindow cards
  |-- Auto-fit bounds when filtered results change
  v
Hero Search (hero-search.tsx)
  |-- Reuses the same shared search components
  |-- Lives on the landing page, navigates to /explore with URL params
  |-- Popular quick-search chips
```

## Key design decisions

### 1. Server fetches everything, client filters instantly

Do NOT fetch on every filter change. Fetch all published listings once on the server page, pass them down, and filter/rank client-side with `useMemo`. This gives:
- Zero loading states for filter changes
- Instant response to typing, dropdown selections, map interactions
- SEO-friendly initial render (server-rendered full list)

For very large datasets (10k+ listings), switch to server-side filtering with debounced API calls instead.

### 2. Two-phase search input

Users type freely into `qInput` (the visual input state). The actual filter `q` only updates when:
- User presses Enter
- User selects a dropdown suggestion
- User clicks the Search button

This prevents jarring re-filtering on every keystroke and lets dropdowns show suggestions without immediately filtering the list.

### 3. Scoring algorithm (filterAndRank)

```
Hard filters (exclude if no match):
  - Category: exact slug match
  - City: fuzzy includes (case-insensitive)
  - When: checks business_hours for day-of-week + time range overlap

Soft filter (ranking only):
  - Search text scoring:
    - Exact name match: +100
    - Name starts with: +80
    - Name contains: +50
    - Category contains: +20
    - Description contains: +10
    - No match: -50

Boosts:
  - Featured: +5
  - Rating: +avgRating
```

If only soft filters are active (no hard filters), show all results but sorted by score. Never show zero results for a text search alone — just rank them.

### 4. Dropdown behavior

- `onMouseDown={e => e.preventDefault()}` on dropdown items prevents input blur before click registers
- Outside-click handler via `useEffect` + `document.addEventListener("mousedown", ...)`
- Each dropdown tracks its own ref for the outside-click check
- Dropdowns use `absolute` positioning with `z-50`

### 5. Map integration

- **Lazy load**: `const ExploreMap = lazy(() => import("./explore-map"))` — prevents SSR crashes
- **SVG pins**: Custom SVG path for location pin shape, white circle + first letter of listing name
- **InfoWindow**: Shows cover image, name, category, city, rating, "View" link
- **Auto-fit bounds**: `useEffect` watches the businesses array, builds `google.maps.LatLngBounds`, calls `map.fitBounds()` with padding. Tracks previous business IDs to avoid redundant fits.
- **Pin click → list scroll**: Scroll the list panel (not the page!) to the matching card using manual offset calculation: `panel.scrollBy({ top: offset, behavior: "smooth" })`
- **Hover sync**: Hovering a card highlights the map pin, clicking a pin highlights the card

### 6. Location features

- **Browser geolocation**: `navigator.geolocation.getCurrentPosition` + Nominatim reverse geocoding (free, no API key)
- **Location history**: `localStorage` with max 5 entries, newest first
- **Export `addToLocationHistory(city)`** so other components (hero search) can save locations too

### 7. When filter (date + time-of-day)

- Calendar grid: 6 rows, highlights today, disables past dates, month navigation
- Time-of-day: Anytime, Morning (6am-12pm), Afternoon (12pm-5pm), Evening (5pm-9pm)
- `isOpenAt()` function: checks `business_hours` data for day_of_week match + time range overlap
- `formatWhenLabel()`: "Today, Morning" / "Jul 15, Evening" / "Tomorrow"

### 8. Hero search (landing page)

- Reuses the exact same shared dropdown components
- Three fields in a styled container: Search + Location (row 1), When + Search button (row 2)
- Popular quick-search chips below
- On submit: builds URLSearchParams and navigates to `/explore?q=...&city=...&date=...&time=...`
- Explore page reads URL params as initial filter state

## File structure

```
src/
  components/
    search/
      search-dropdown.tsx    # Service + listing suggestions
      location-dropdown.tsx  # Geolocation + history
      when-filter.tsx        # Calendar + time-of-day
    public/
      hero-search.tsx        # Landing page search bar
  app/
    (public)/
      explore/
        page.tsx             # Server component — data fetching
        explore-client.tsx   # Client component — filtering, layout, cards
        explore-map.tsx      # Google Maps with pins + InfoWindows
    page.tsx                 # Homepage with HeroSearch
  lib/
    explore/
      actions.ts             # Type definitions (ExploreBusiness)
      utils.ts               # resolveCardImage helper
```

## Adapting to a new project

### 1. Define your listing type

Replace `ExploreBusiness` with your domain type (e.g., `Restaurant`, `Property`, `Doctor`). Required fields:

```typescript
type Listing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;       // resolved cover/gallery/logo
  city: string | null;
  latitude: number | null;       // for map (nullable = no pin)
  longitude: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  avgRating: number | null;
  reviewCount: number;
  is_featured: boolean;
  isFavorited: boolean;          // requires auth
};
```

### 2. Adapt the server page

Replace the Supabase queries with your data source. The pattern is always:
1. Fetch all published listings (with category join)
2. Fetch all active services/tags (for search suggestions)
3. Fetch operating hours (for When filter)
4. Fetch reviews (for ratings)
5. Check auth + fetch favorites
6. Build the serialized array + service name counts

### 3. Adapt the search dropdown

The `SearchBusiness` type in `search-dropdown.tsx` is intentionally minimal — just `id, name, slug, description, imageUrl, categoryName, city, avgRating`. Map your listing type to this.

The `ServiceSuggestion` type (`{ name: string; count: number }`) represents searchable tags/services. Replace with whatever your domain calls them (cuisines, specialties, amenities, etc.).

### 4. Adapt the When filter

If your domain doesn't have operating hours (e.g., properties), remove the When filter entirely. If it does, adapt `isOpenAt()` to your hours data structure.

### 5. Map setup

Requires:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` env var (for AdvancedMarker)
- `@vis.gl/react-google-maps` and `@googlemaps/markerclusterer` packages

If you don't need a map, remove the map panel and the `mappable` useMemo. The list works standalone.

### 6. Styling

The reference code uses semantic CSS tokens (`text-foreground`, `bg-card`, `border-border`, `text-primary`, etc.). Replace with your project's design system. The layout classes (Tailwind responsive prefixes) are standard and portable.

## Responsive breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Mobile (<640px) | Single column, stacked filters, map behind toggle button |
| Tablet (640-1023px) | Filters wrap in rows, grid cards 2-col, map behind toggle |
| Desktop (1024px+) | Filters in single row, list panel (50%) + map panel (50%) side by side |

## Packages required

```json
{
  "@vis.gl/react-google-maps": "^1.x",
  "@googlemaps/markerclusterer": "^2.x",
  "lucide-react": "^0.x"
}
```

## Common pitfalls

1. **setState inside useMemo** — Never call `setState` during render. If you need a loading indicator, filtering is instant and doesn't need one.
2. **Nested `<button>` elements** — Calendar buttons inside filter buttons cause hydration errors. Use `<span role="button">` for inner clickable elements.
3. **`scrollIntoView` bubbling** — Don't use `scrollIntoView` for pin-click-to-card scroll. It bubbles to the body and hides the header. Use manual `panel.scrollBy({ top: offset })` instead.
4. **`window.Map` in SSR** — Always lazy-load the map component. `useRef(new window.Map())` crashes during server rendering.
5. **Input blur vs dropdown click** — Without `onMouseDown={e => e.preventDefault()}` on dropdown items, the input blurs before the click registers, closing the dropdown.
6. **Dropdown overflow on mobile** — Use fixed widths (`w-[280px]`) instead of `left-0 right-0` to prevent dropdowns from extending off-screen.
