@AGENTS.md

# Zawadi — Project Context for Claude Code

You are building **Zawadi**, a beauty & wellness booking marketplace (a from-scratch rebuild of an existing WordPress/Listeo+Booknetic site onto a modern stack). Read this file fully before writing code. The authoritative data model lives in `docs/zawadi-schema.md` — always defer to it.

## Project Status (keep this updated)
**DONE**
- Project scaffolded (Next.js + TypeScript + Tailwind), pushed to GitHub.
- `CLAUDE.md` + `docs/zawadi-schema.md` (authoritative 24-table model) in place.
- Supabase CLI linked; DB live with all 24 tables, enums, RLS enabled, seed data (Free/Premium plans + service categories). Types at `src/lib/database.types.ts`.
- Supabase clients exist: `src/lib/supabase/{client,server,admin}.ts`.
- Design-reference system: `.claude/skills/zawadi-frontend/` (brand tokens + inspiration folder).
- ~5 commits pushed.

**NOT BUILT YET** (don't build unless the task says so)
- Auth, dashboards, public pages, booking engine, payments, messaging.

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
- **Premium (paid, per active staff seat):** the full product — booking engine, online prepay + tips, multiple staff, in-app messaging, earnings/analytics, full profile, featured-placement eligibility, and a **shareable booking link** (`/book/{booking_link_token}`).
- **14-day trial = full Premium** (`subscription_status = 'trialing'`), no separate trial caps. **No credit card required to start the trial.**
- **`plans.features` (jsonb) is the single source of truth** for all gates/quotas. Read it for every feature check; never hardcode limits.
- **On lapse, downgrade = swap `businesses.plan_id` to the Free plan** (never delete). Premium features lock, excess staff go `inactive`, already-prepaid future bookings are honored, resubscribe reactivates instantly.

## Gating ladder (enforce server-side)
- Listed in directory: any verified + published business (Free or Premium).
- Booking engine on: `plan.tier = 'premium' AND subscription_status IN ('trialing','active')`.
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
