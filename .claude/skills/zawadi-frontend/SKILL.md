---
name: krowned-frontend
description: Brand design system and frontend conventions for the Krown booking marketplace. Read this BEFORE building, editing, or styling ANY UI — pages, components, layouts, forms, dashboards, emails. Defines the brand identity, the token system (single source of truth in src/app/globals.css), light/dark theming, typography, component patterns, and the hard rule against hardcoding brand values.
---

# Krown Frontend Design System

Krown is a beauty & wellness booking marketplace (Kenya-first, built to scale globally). The brand is **bold, luxurious, and confidently premium** — it should never read as a generic SaaS template. Your job when building UI is to render *this* brand faithfully and consistently, not to invent a new look each time.

## The one hard rule

**Never hardcode a brand value. Always use the semantic tokens.**

- No `bg-[#D9B36C]`, `style={{ color: '#0C0B0A' }}`, `font-family: 'Jost'`, a raw gradient
- Yes `bg-primary`, `text-foreground`, `font-heading`, `bg-gradient-hero`

The tokens live in **`src/app/globals.css`** — that is the single source of truth. Every color, font, gradient, and radius is defined there once, with a light set and a `.dark` set. If you hardcode a value, it won't respond to the theme switch and it won't update when the brand is adjusted. If you need a brand value that doesn't have a token yet, add a token in globals.css rather than inlining a hex.

## Brand identity (what it should feel like)

- **Light-first.** Default surfaces are white / warm off-white; text is near-black. Gold is the *accent and emotional punch* (CTAs, icons, active states, links, key bands). A dark theme (signature black/gold luxury) exists via toggle.
- **Gold is primary** (`#D9B36C`), bronze (`#8A6A2F`) is a sparing accent. Don't overuse bronze.
- **Signature element:** the black→charcoal→bronze→gold diagonal gradient (`bg-gradient-hero`). Use it for hero moments and major CTA bands — deliberately, not everywhere. This is the thing the brand is remembered by; keep it special.
- **Tone of copy:** plain, active, confident, friendly. "Book it." not "Submit your booking request." Sentence case.

## Tokens available (defined in globals.css)

Surfaces/text: `background`, `foreground`, `card`, `card-foreground`, `popover`, `muted`, `muted-foreground`, `border`, `input`, `ring`
Brand: `primary` (+`-foreground`), `secondary` (+`-foreground`), `accent` (+`-foreground`)
Status: `destructive`, `success`, `warning`, `info`
Brand scale (for gradients/one-offs): `brand-deep`, `brand-dark`, `brand`, `brand-light`, `brand-lavender`, `brand-teal`, `brand-coral`, `brand-pink`
Gradient: `.bg-gradient-hero`
Fonts: `font-heading` (Jost), `font-body` (Montserrat)
Radius: `rounded-sm/md/lg/xl` (base 10px); pills use `rounded-full`

> The core palette is the **official Krown brand colors**: Gold `#D9B36C` (primary), Bronze `#8A6A2F` (accent), Near-black `#0C0B0A` (dark surface), Charcoal `#1C1A17` (card surface), Cream `#F2E7D3` (text on dark). Components never change, because they only reference tokens.

## Brand assets (`public/brand/`)

- `logo-white.png` — Krown wordmark (cream/white on transparent), use on dark backgrounds
- `logo-black.png` — Krown wordmark (black on transparent), use on light backgrounds
- `favicon-white.png` / `favicon-black.png` — "k" icon mark
- `icon-dark-bg.png` / `icon-light-bg.png` — "k" icon with background fill
- `hero-salon.png` — Salon interior (homepage hero)
- `hero-tools.png` — Product flatlay (auth page background)

## Typography

- **Headings:** `font-heading` — **Jost** (geometric Google font). Weights: bold/extra-bold for display, medium for subheads. Slight negative letter-spacing on large headings.
- **Body:** `font-body` — **Montserrat**. Regular for body, semibold/bold for emphasis.
- Wire both via `next/font` in `src/app/layout.tsx`, exposing `--font-jost` and `--font-montserrat` CSS variables (globals.css references these). Set a clear type scale; headings always use `font-heading`, never default to body for a heading.

## Theming (light + dark)

- Light is default. Dark activates with a `.dark` class on `<html>`.
- Use a theme provider (e.g. `next-themes`) with a toggle in the header/nav; persist the choice; avoid the flash-of-wrong-theme on load.
- **Build and check both themes.** Anything you build must look right in light AND dark. Because you use semantic tokens, this should be automatic — but verify contrast, especially on the gradient bands and on muted surfaces.

## Component conventions

- **Buttons:** primary = `bg-primary text-primary-foreground` with `rounded-lg` (or `rounded-full` for pill CTAs); secondary/ghost use `secondary`/`border`. Clear hover + visible focus ring (`ring-ring`). Label says exactly what happens ("Book", "List Your Business").
- **Cards:** `bg-card border border-border rounded-xl` with soft shadow; used for pro listings, categories, testimonials, dashboard stat tiles.
- **Inputs:** `bg-background border border-input rounded-lg`, focus ring `ring-ring`.
- **Badges/ribbons:** "Featured", "Verified" — small pills; Featured uses brand/secondary fills, Verified pairs with a check icon.
- **Icon circles:** soft `secondary` fill with a `primary` icon (the "How it works" steps).
- **Gradient bands:** `bg-gradient-hero` full-width sections with white text; reserved for major conversion moments.

## Quality floor (non-negotiable)

- Responsive, mobile-first — design down to small screens.
- Visible keyboard focus on every interactive element; respect `prefers-reduced-motion`.
- WCAG AA contrast — watch text on gradient bands and on `muted`.
- Don't cancel out spacing with competing selectors; keep section padding consistent.

## Before you finish any UI work

1. Did you use tokens for every color/font/gradient (no hardcoded hex)?
2. Does it look right in BOTH light and dark?
3. Is it responsive down to mobile with visible focus states?
4. Does it match the brand patterns?
5. Is the copy plain, active, and in Krown's voice?
