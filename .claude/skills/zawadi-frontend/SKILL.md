---
name: zawadi-frontend
description: Brand design system and frontend conventions for the Zawadi booking marketplace. Read this BEFORE building, editing, or styling ANY UI — pages, components, layouts, forms, dashboards, emails. Defines the brand identity, the token system (single source of truth in src/app/globals.css), light/dark theming, typography, component patterns, and the hard rule against hardcoding brand values.
---

# Zawadi Frontend Design System

Zawadi is a beauty & wellness booking marketplace (Kenya-first, built to scale globally). The brand is **warm, trustworthy, and premium-but-approachable** — it should never read as a generic SaaS template. Your job when building UI is to render *this* brand faithfully and consistently, not to invent a new look each time.

## The one hard rule

**Never hardcode a brand value. Always use the semantic tokens.**

- ❌ `bg-[#7c3aed]`, `style={{ color: '#171221' }}`, `font-family: 'Jost'`, a raw gradient
- ✅ `bg-primary`, `text-foreground`, `font-heading`, `bg-gradient-hero`

The tokens live in **`src/app/globals.css`** — that is the single source of truth. Every color, font, gradient, and radius is defined there once, with a light set and a `.dark` set. If you hardcode a value, it won't respond to the theme switch and it won't update when the brand is adjusted. If you need a brand value that doesn't have a token yet, add a token in globals.css rather than inlining a hex.

## Brand identity (what it should feel like)

- **Light-first.** Default surfaces are white / very-light lavender-gray; text is near-black. Purple is the *accent and emotional punch* (CTAs, icons, active states, links, key bands) — **not** the page background. A full dark theme exists via toggle.
- **Purple is primary**, teal is a sparing accent. Don't overuse teal.
- **Signature element:** the purple→warm-coral diagonal gradient (`bg-gradient-hero`). Use it for hero moments and major CTA bands ("Become a Vendor", partner sections) — deliberately, not everywhere. This is the thing the brand is remembered by; keep it special.
- **Tone of copy:** plain, active, confident, friendly. "Book it." not "Submit your booking request." Sentence case. See globals + the marketing voice in the mockups.

## Tokens available (defined in globals.css)

Surfaces/text: `background`, `foreground`, `card`, `card-foreground`, `popover`, `muted`, `muted-foreground`, `border`, `input`, `ring`
Brand: `primary` (+`-foreground`), `secondary` (+`-foreground`), `accent` (+`-foreground`)
Status: `destructive`, `success`, `warning`, `info`
Brand scale (for gradients/one-offs): `brand-deep`, `brand-dark`, `brand`, `brand-light`, `brand-lavender`, `brand-teal`, `brand-coral`, `brand-pink`
Gradient: `.bg-gradient-hero`
Fonts: `font-heading` (Futura→Jost), `font-body` (Montserrat)
Radius: `rounded-sm/md/lg/xl` (base 10px); pills use `rounded-full`

> ⚠️ The core palette is now the **official Zawadi brand colors**: Royal Violet `#5604ad` (primary), Lavender Glow `#9e8ed4` (secondary), Midnight Slate `#2e3043` (dark surface / ink), Teal Horizon `#3b9bbb` (accent). A few derived/supporting values (neutrals, the warm coral gradient tail from the mockups) remain marked `VERIFY` in globals.css. When Eddie confirms those, they get swapped — components never change, because they only reference tokens.

## Typography

- **Headings:** `font-heading` — Futura (the brand title face), substituted with **Jost** (geometric Google font, close to Futura) until the real Futura files are added. Weights: bold/extra-bold for display, medium for subheads. Slight negative letter-spacing on large headings.
- **Body:** `font-body` — **Montserrat**. Regular for body, semibold/bold for emphasis.
- **Logo font** is AI Nevrada (logo asset only — not used in app UI; logo is currently a placeholder).
- Wire both via `next/font` in `src/app/layout.tsx`, exposing `--font-jost` and `--font-montserrat` CSS variables (globals.css references these). Set a clear type scale; headings always use `font-heading`, never default to body for a heading.

## Theming (light + dark)

- Light is default. Dark activates with a `.dark` class on `<html>`.
- Use a theme provider (e.g. `next-themes`) with a toggle in the header/nav; persist the choice; avoid the flash-of-wrong-theme on load.
- **Build and check both themes.** Anything you build must look right in light AND dark. Because you use semantic tokens, this should be automatic — but verify contrast, especially on the gradient bands and on muted surfaces.

## Component conventions

Reference the mockups in `inspiration/` for exact look. General patterns:

- **Buttons:** primary = `bg-primary text-primary-foreground` with `rounded-lg` (or `rounded-full` for pill CTAs like the category "Explore" buttons); secondary/ghost use `secondary`/`border`. Clear hover + visible focus ring (`ring-ring`). Label says exactly what happens ("Book", "List Your Business").
- **Cards:** `bg-card border border-border rounded-xl` with soft shadow; used for pro listings, categories, testimonials, dashboard stat tiles.
- **Inputs:** `bg-background border border-input rounded-lg`, focus ring `ring-ring`. The hero search bar is a grouped multi-field control (service / location / category / Search button).
- **Badges/ribbons:** "Featured", "Verified" — small pills; Featured uses brand/secondary fills, Verified pairs with a check icon. Corner ribbons on featured pro cards.
- **Category cards:** image with a purple-tinted overlay, label, and a pill "Explore" button (matches landing mockup).
- **Pro cards:** photo, name + verified badge, location, price range, rating, Book button.
- **Icon circles:** soft `secondary`/lavender fill with a `primary` icon (the "How it works" steps).
- **Gradient bands:** `bg-gradient-hero` full-width sections with white text + an illustration; reserved for major conversion moments.

## Imagery & illustration

- **Photography:** natural-light, candid salon/barber/wellness moments; real people, warm and aspirational.
- **Illustrations:** friendly flat style with the brand purples + teal, soft warm-tone accents (see style guide). Use for empty states, the partner/CTA bands, onboarding.

## Quality floor (non-negotiable)

- Responsive, mobile-first — these mockups are desktop; design down to small screens.
- Visible keyboard focus on every interactive element; respect `prefers-reduced-motion`.
- WCAG AA contrast — watch text on gradient bands and on `muted`.
- Don't cancel out spacing with competing selectors; keep section padding consistent.

## Before you finish any UI work

1. Did you use tokens for every color/font/gradient (no hardcoded hex)?
2. Does it look right in BOTH light and dark?
3. Is it responsive down to mobile with visible focus states?
4. Does it match the brand patterns and the `inspiration/` references?
5. Is the copy plain, active, and in Zawadi's voice?
