@AGENTS.md

# Zawadi — Project Context for Claude Code

You are building **Zawadi**, a beauty & wellness booking marketplace (a from-scratch rebuild of an existing WordPress/Listeo+Booknetic site onto a modern stack). Read this file fully before writing code. The authoritative data model lives in `docs/zawadi-schema.md` — always defer to it.

## Project Status (keep this updated)
**DONE**
- Live database: 24 tables, 13 enums, RLS policies, seeded at scale (20 businesses, ~50 clients, ~120 bookings, reviews, favorites). Types at `src/lib/database.types.ts`.
- Design system in brand: Royal Violet / Lavender / Midnight Slate / Teal, Jost + Montserrat, light + dark themes, all semantic tokens.
- Auth + role-based routing (client, business owner, staff, super admin). Middleware in `src/proxy.ts`.
- All dashboards + public site: 41 pages (admin, business, staff, client dashboards; homepage, explore, business profiles, booking, how-it-works, for-professionals, contact, privacy, terms).
- Services / staff / schedule management (business dashboard).
- Booking availability engine: 30-min slots, business-timezone aware (DST-safe), 1hr lead time, 60-day window, "any available" auto-assign (lightest-loaded), transactional double-booking guard via `pg_advisory_xact_lock`, 10-min `pending_hold` mechanism. Verified end-to-end.
- Admin data tables (`DataTable` component): search, column sort, pagination (20/page), CSV + PDF export (`jspdf` + `jspdf-autotable`). Applied to businesses, users, bookings.
- Admin category management: CRUD, reorder, Lucide icon picker (shared `src/lib/category-icons.ts` map), super-admin-only, delete guarded by service-in-use check.
- Quick fixes: category icons render as Lucide components, 12h AM/PM time display, per-service "Book" buttons on business profile.

**NOT DONE / NEXT** (in priority order — don't build unless the task says so)
1. **Stripe** — booking flow currently confirms as a STUB (no payment). Need: Payment Intents (prepay), Connect Express (vendor payouts), Billing (Free→Premium subscription, 14-day trial). `// REVIEW` markers in `booking-flow.tsx` and `actions.ts` where payment plugs in. Also: guest checkout + auto-account-creation, elevated confirmation page (add-to-calendar .ics, QR code, booking ref). Requires Resend for transactional email.
2. **Analytics dashboards with charts** (admin overview + finance) — best after Stripe so there's real transaction data.
3. **Live / fuzzy search-as-you-type** on `/explore`.
4. **CMS** (deferred to v2).

## Frontend / UI work — read the design skill first
Before writing or editing **any** UI (pages, components, styling, theming), consult **`.claude/skills/zawadi-frontend/`** — read its `SKILL.md` and `tokens.css`, and check `inspiration/` for visual reference. Use Eddie's brand tokens, not default/generic styling. Brand tokens are currently PLACEHOLDERS pending Eddie's real values.

## Stack
- **Next.js** (App Router, TypeScript, Tailwind, `src/` dir, import alias `@/*`)
- **Supabase** — Postgres, Auth, Realtime, Row-Level Security, Storage
- **Stripe** — Connect (Express) for marketplace payments **and** Billing for vendor subscriptions
- **Vercel** for hosting
- **zod** for validation, **@supabase/ssr** for auth in the App Router

## What the product is
A four-sided marketplace: **clients** discover and book services; **businesses** (the tenant) list services and receive bookings; **staff** provide services and manage their own schedules; a **super admin** runs the platform. Clients pay full price up front (or pay at the store) and can tip.

## Non-negotiable architectural decisions
1. **One identity, many hats.** Every person is one `auth.users` + `profiles` row. Roles are derived from relationships, NOT a fixed label: client = anyone; business owner = owns a `businesses` row; staff = has a `staff` row; super admin = `profiles.platform_role = 'super_admin'`. Never create duplicate accounts per role.
2. **A business is the tenant. A solo pro is just a business with one `staff` row (themselves).** Never special-case solo operators. An owner who doesn't perform services simply has no `staff` row.
3. **The same `businesses` row holds two Stripe IDs pointing opposite ways:** `stripe_connect_account_id` (RECEIVES client money) and `stripe_billing_customer_id` (PAYS us the subscription). Different Stripe objects, different webhooks. Never conflate them.
4. **Money is stored as integers in minor units (cents), never floats.** Every price, fee, tip, and Stripe amount.
5. **All money + booking writes go through trusted server-side code** (Route Handlers / Server Actions / Edge Functions using the service role) — never direct client inserts. RLS protects reads; server logic protects writes (slot-collision validation, Stripe calls, fee math, seat counting).
6. **Platform fee applies to the SERVICE amount only; tips pass through 100%** to the business. `application_fee = service_amount × business.commission_rate`. The charge total is `service + tip`.
7. **Service-first, staff-optional booking.** Client always picks a service; staff is optional. If "any available," auto-assign a staff member who is in `staff_services` (capable) AND free at that slot (lightest load wins). Availability = `business_hours` ∩ `staff_schedules` − `schedule_exceptions` − existing `bookings`.

## Freemium model (every business is always on a plan)
- **Free (forever, $0):** visibility only — directory listing + basic profile. **NOT bookable.** No booking engine, payments, staff, or messaging.
- **Starter ($15/seat/mo):** booking engine, online payments, 1 staff, 5 bookable services, shareable link. No messaging, no featured placement.
- **Pro ($25/seat/mo):** everything in Starter + up to 10 staff, unlimited services, messaging. No featured placement.
- **Enterprise ($49/seat/mo):** everything in Pro + unlimited staff, featured-placement eligibility.
- **14-day trial = full paid tier** (`subscription_status = 'trialing'`), no separate trial caps. **No credit card required to start the trial.**
- **`plans.features` (jsonb) is the single source of truth** for all gates/quotas. Read it for every feature check; never hardcode limits.
- **On lapse, downgrade = swap `businesses.plan_id` to the Free plan** (never delete). Paid features lock, excess staff go `inactive`, already-prepaid future bookings are honored, resubscribe reactivates instantly.

## Gating ladder (enforce server-side)
- Listed in directory: any verified + published business (any plan).
- Booking engine on: `plan.tier IN ('starter','pro','enterprise') AND subscription_status IN ('trialing','active')`. Use `isBookable()` from `@/lib/plans`.
- Online prepay + tips: the above AND `businesses.charges_enabled = true`.
- Pay-at-store bookings: booking engine on (no Stripe needed).

## Messaging & notifications (two separate systems)
- **In-app messaging:** Supabase Realtime, business-scoped, optionally pinned to a booking. Access via `conversation_participants` (client + owner + assigned staff). No email fallback on messages.
- **Email notifications:** transactional, for booking confirmed/reminder/cancelled, review requests, payouts, staff invites, Stripe nudges. Per-user/per-event preferences in `notification_preferences` (channels: `in_app`, `email`).

## Conventions
- Server-side Supabase client uses the **service role** only in trusted server code; never expose it to the browser.
- Validate every server input with **zod** before any DB/Stripe call.
- Public reads rely on RLS; assume RLS is ON for every table.
- Booking `source` (`marketplace` / `direct_link` / `manual`) is set on every booking — it's the own-client-vs-discovery attribution signal.
- Keep payments behind a `PaymentProvider` interface; Stripe is the only v1 implementation (M-Pesa/Daraja comes later for Kenya).

## Deferred to v2 (do NOT build now)
Boost new-client commission engine (attribution is already captured via `booking.source`), multi-location businesses, M-Pesa, gift cards / loyalty / packages / combo services, SMS notifications, blog/CMS.

## Workflow expectations
- Propose a plan before large changes. Work in small, reviewable steps.
- Database changes go in `supabase/migrations/` as timestamped SQL, never ad-hoc dashboard edits.
- After schema changes, regenerate types: `supabase gen types typescript`.
- Don't invent features or fields not in `docs/zawadi-schema.md` without flagging it first.
