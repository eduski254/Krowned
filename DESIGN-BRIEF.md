# Krowned — Design Brief & Stylesheet Reference

## What This Is

Krowned is a booking marketplace for textured-hair professionals — braiders, loc techs, natural-hair stylists, and barbers — in the Washington DC / Maryland / Northern Virginia (DMV) area. Clients discover verified stylists, book real time slots, and pay online.

The brand is **bold, luxurious, and confidently premium**. It should never look like a generic SaaS template. Think: the confidence of a fresh set of knotless braids meets the polish of a luxury concierge app.

**Domain:** krowned.app
**Tagline:** "Your crown, booked."

---

## Color Palette

### Core Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Gold** | `#D9B36C` | Primary accent — CTAs, links, focus rings, active states, icons, key highlights |
| **Bronze** | `#8A6A2F` | Secondary accent — sparing use, gradient midpoint, subtle emphasis |
| **Near-black** | `#0C0B0A` | Dark surfaces, light-mode primary buttons, dark-mode page background |
| **Charcoal** | `#1C1A17` | Card surfaces (dark mode), gradient start, elevated dark surfaces |
| **Cream** | `#F2E7D3` | Text on dark backgrounds, light brand surface |

### Light Theme (Default)
| Token | Hex | Role |
|-------|-----|------|
| `background` | `#FFFFFF` | Page base |
| `foreground` | `#0C0B0A` | Primary text |
| `card` | `#FFFFFF` | Card/panel surface |
| `muted` | `#F5F1EB` | Warm off-white section backgrounds |
| `muted-foreground` | `#6B5D4F` | Secondary/helper text |
| `border` | `#E8E0D6` | Warm light borders |
| `input` | `#E8E0D6` | Input borders |
| `ring` | `#D9B36C` | Focus rings (gold) |
| `primary` | `#0C0B0A` | Buttons — near-black with white text |
| `primary-foreground` | `#FFFFFF` | Text on primary buttons |
| `secondary` | `#F5F1EB` | Secondary button/badge background |
| `secondary-foreground` | `#0C0B0A` | Text on secondary |
| `accent` | `#8A6A2F` | Bronze accent |
| `accent-foreground` | `#FFFFFF` | Text on accent |

### Dark Theme (Luxury Mode)
| Token | Hex | Role |
|-------|-----|------|
| `background` | `#0C0B0A` | Near-black page base |
| `foreground` | `#F2E7D3` | Cream text |
| `card` | `#1C1A17` | Charcoal card surface |
| `muted` | `#1C1A17` | Charcoal section backgrounds |
| `muted-foreground` | `#9E7E42` | Bronze secondary text |
| `border` | `#2A2622` | Subtle warm border |
| `input` | `#3D3831` | Input border |
| `ring` | `#D9B36C` | Focus rings (gold) |
| `primary` | `#D9B36C` | Buttons — gold with near-black text |
| `primary-foreground` | `#0C0B0A` | Text on primary buttons |
| `secondary` | `#2A2622` | Raised charcoal surface |
| `secondary-foreground` | `#F2E7D3` | Cream text on secondary |
| `accent` | `#8A6A2F` | Bronze accent |
| `accent-foreground` | `#F2E7D3` | Cream text on accent |

### Status Colors
| Token | Light | Dark |
|-------|-------|------|
| `destructive` | `#DC2626` | `#EF4444` |
| `success` | `#16A34A` | `#4ADE80` |
| `warning` | `#CA8A04` | `#FCD34D` |
| `info` | `#2563EB` | `#93C5FD` |

---

## Signature Gradient

The **hero gradient** is the single most recognizable brand element. It flows diagonally at 120deg:

```
Near-black #0C0B0A (0%) → Charcoal #1C1A17 (30%) → Bronze #8A6A2F (60%) → Gold #D9B36C (100%)
```

Use it for:
- Hero sections (homepage, landing pages)
- Major CTA bands (conversion moments)
- Full-width accent strips

Do NOT use it for small elements, cards, or buttons. Keep it special — it's the thing the brand is remembered by.

---

## Typography

### Headings — TAN Meringue
- **Font:** TAN Meringue (custom display font, .otf)
- **Fallback chain:** Futura → Century Gothic → system sans-serif
- **Weight:** Bold (700) for display headings
- **Letter spacing:** `0.07em` (slightly tracked out — gives it a luxury editorial feel)
- **Use for:** All h1–h6 elements, hero headlines, section titles, display text

### Body — Montserrat
- **Font:** Montserrat (Google Font)
- **Weights:** Regular (400) for body, Semibold (600) for emphasis, Bold (700) for strong labels
- **Use for:** All body text, paragraphs, form labels, buttons, navigation, captions

### Type Scale (suggested)
| Element | Size (mobile → desktop) | Font | Weight |
|---------|------------------------|------|--------|
| Hero h1 | 30px → 48px → 60px | TAN Meringue | 800 |
| Section h2 | 24px → 30px | TAN Meringue | 700 |
| Card h3 | 16px → 18px | TAN Meringue | 700 |
| Body | 14px → 16px | Montserrat | 400 |
| Small/caption | 12px → 14px | Montserrat | 400–500 |
| Button label | 14px | Montserrat | 600 |
| Nav link | 14px | Montserrat | 500 |

---

## Component Patterns

### Buttons
| Variant | Background | Text | Border | Radius |
|---------|-----------|------|--------|--------|
| **Primary** | `primary` | `primary-foreground` | none | `rounded-lg` (8px) |
| **Secondary** | transparent | `foreground` | `border` | `rounded-lg` |
| **Ghost** | transparent | `foreground` | none | `rounded-lg` |
| **Pill CTA** | `primary` | `primary-foreground` | none | `rounded-full` |
| **Destructive** | `destructive` | white | none | `rounded-lg` |

- Hover: slight opacity shift (`primary/90`) or background fill for ghost
- Focus: visible `ring` (gold) — 2px offset
- Labels: plain active verbs — "Book Now", "Find Your Stylist", "List Your Studio"

### Cards
- Background: `card` with `border border-border`
- Radius: `rounded-xl` (12px)
- Shadow: subtle (`0 8px 20px rgba(0,0,0,0.15)`)
- Hover: lift (`-translate-y-0.5`) + slightly stronger shadow
- Used for: business listings, category tiles, testimonials, dashboard stat tiles, service rows

### Inputs
- Background: `background`
- Border: `border-input`, `rounded-lg`
- Focus: `ring-2 ring-ring` (gold ring)
- Label: `text-sm font-medium text-foreground` above input
- Placeholder: `text-muted-foreground`

### Badges / Pills
- **Featured:** gold or secondary fill, small rounded-full pill
- **Verified:** paired with a checkmark icon
- **Category tag:** `bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs`

### Icon Circles
- Container: `bg-primary/10 rounded-full` (10% opacity primary)
- Icon: `text-primary` (gold in dark, near-black in light)
- Used in "How it Works" steps, trust signal bars, feature grids

---

## Page Patterns

### Hero Sections
- Full-viewport (`min-h-[100dvh]`) background image with gradient overlay
- Gradient overlay: `bg-gradient-hero opacity-60` + `bg-black/20` on top
- White text, centered, with a search bar or CTA
- Trust badges below CTA: icon + label pairs in `text-white/70`

### Section Layout
- Max width: `max-w-7xl` (1280px) centered
- Padding: `px-4 py-16 sm:px-6 lg:px-8`
- Section title: centered h2 + subtitle in `text-muted-foreground`
- Grid: responsive `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

### Alternating Sections
- White background → `bg-muted/50` or `bg-muted/30` → white
- Separator: `border-t border-border` or `border-y border-border`
- CTA bands use the hero gradient (full-width, white text)

### Navigation
- Sticky header: `bg-background/95 backdrop-blur-md border-b border-border`
- Logo: TAN Meringue wordmark (black on light, white on dark)
- Nav links: `text-sm font-medium text-muted-foreground hover:text-foreground`
- Mobile: hamburger → slide-in drawer

---

## Brand Voice (for any copy in designs)

- **Tone:** Plain, active, confident, friendly. Not corporate, not overly casual.
- **Sentence case** everywhere (not Title Case for body copy).
- **Action-first:** "Book it." not "Submit your booking request."
- **Community-aware:** Speak to textured hair directly — braids, locs, naturals, fades. Never generic "hair services."
- **Example headlines:**
  - "Your crown, booked."
  - "Booking that finally gets your hair."
  - "Three steps. No DMs. No drama."
  - "Every stylist specializes in textured hair. Find yours."
  - "You braid, loc, or style textured hair?"

---

## Brand Assets Available

| Asset | File | Use |
|-------|------|-----|
| Logo (light bg) | `logo-black.png` | Header, footer, emails on white |
| Logo (dark bg) | `logo-white.png` | Header on dark, hero overlays |
| Favicon | `favicon-black.png` / `favicon-white.png` | Browser tab |
| Icon mark | `icon-dark-bg.png` / `icon-light-bg.png` | App icon, social avatar |
| Hero photo | `hero-salon.webp` | Homepage hero background |
| Background | `bg-hero.webp` | Landing page hero sections |
| Directory preview | `directory-preview.webp` | Marketing mockup of explore page |
| Dashboard preview | `dashboard-preview.webp` | Marketing mockup of business dashboard |
| Styles photo (woman) | `styles-woman.webp` | Parallax band on styles page |
| Styles photo (man) | `styles-man.webp` | Available for style/barber pages |

---

## What We Need From the Stylesheet

1. **Color system** — swatches with all tokens for light and dark
2. **Typography scale** — heading hierarchy with TAN Meringue + Montserrat specimens
3. **Button library** — all variants, states (default, hover, focus, disabled), sizes
4. **Card patterns** — business listing card, stat card, testimonial card, service row
5. **Form elements** — inputs, textareas, selects, checkboxes, radio buttons
6. **Badge/pill library** — featured, verified, category, status
7. **Navigation** — header (desktop + mobile), sidebar (dashboard), breadcrumbs
8. **Hero section** — with gradient overlay, search bar, trust badges
9. **Icon style** — Lucide icon set, shown in icon circles
10. **Spacing/grid** — section padding, card gaps, responsive breakpoints
11. **Dark mode** — full dark-mode versions of all the above

The stylesheet should be production-ready and match what's already built in the live app. We're codifying the visual language, not inventing a new one.
