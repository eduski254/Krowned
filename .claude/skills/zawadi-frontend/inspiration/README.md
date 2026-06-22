# Inspiration — Zawadi visual references

Claude Code reads this folder for **visual reference** whenever it builds Zawadi UI. The `zawadi-frontend` skill points here. Drop brand assets and mockups in this folder so the agent matches the real look and feel, not a guess.

## What to add here

- **Brand style guide** — the official Zawadi style guide (colors, type, logo usage, illustration style). The source of truth for the `VERIFY` token values in `globals.css`.
- **Landing page mockup** — the approved home page design (hero, categories grid, top pros, gradient CTA bands, testimonials, footer).
- **Dashboard mockups** — client dashboard, business owner dashboard, staff portal, super admin (as they exist).
- **Booking flow mockups** — service selection, staff pick, date/time, checkout.
- **Business profile mockup** — services list, staff, hours, reviews, gallery.
- **Banners / social ads** — for tone, gradient usage, and type treatment.
- **Logo files** — current placeholder + real logo when ready (SVG preferred). Logo will be swapped later.
- **Palette / type reference sheet** — if available, with exact hex codes and font specimens.

## How to use these (for the agent)

- Treat the mockups as the **visual target** for layout, spacing, component styling, and mood.
- Treat the **tokens in `src/app/globals.css` as the source of truth** for actual color/font values — if a mockup color differs from a token, the token wins (and may need a `VERIFY` update from Eddie), never hardcode the mockup color.
- When a mockup exists for the screen you're building, match its structure and hierarchy closely.

## Naming

Use clear names, e.g. `landing-page.png`, `style-guide.png`, `dashboard-client.png`, `dashboard-owner.png`, `booking-flow.png`, `business-profile.png`, `logo-placeholder.svg`.
