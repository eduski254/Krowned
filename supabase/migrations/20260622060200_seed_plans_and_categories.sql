-- ============================================================================
-- Zawadi — Seed: Plans + Service Categories
-- This is a migration (not seed.sql) so it runs on `supabase db push`.
-- ============================================================================

---------------------------------------------------------------------------
-- Plans (Section 4.8 + CLAUDE.md freemium model)
---------------------------------------------------------------------------

insert into plans (tier, name, base_price, per_seat_price, currency, trial_days, stripe_price_id, features, is_active)
values
  (
    'free',
    'Free',
    0,       -- base_price
    0,       -- per_seat_price
    'usd',
    0,       -- trial_days
    null,    -- no Stripe object for Free
    '{
      "bookable": false,
      "online_payments": false,
      "max_staff": 0,
      "max_bookable_services": 0,
      "messaging": false,
      "featured_eligible": false,
      "shareable_link": false
    }'::jsonb,
    true
  ),
  (
    'premium',
    'Zawadi Pro',
    0,       -- base_price: 0 for pure per-seat pricing
    2999,    -- REVIEW: placeholder $29.99/seat/month — adjust to real pricing
    'usd',
    14,      -- 14-day trial
    null,    -- set after Stripe Price is created
    '{
      "bookable": true,
      "online_payments": true,
      "max_staff": null,
      "max_bookable_services": null,
      "messaging": true,
      "featured_eligible": true,
      "shareable_link": true
    }'::jsonb,
    true
  )
on conflict (tier) do nothing;

---------------------------------------------------------------------------
-- Service Categories (per user request)
---------------------------------------------------------------------------

insert into service_categories (name, slug, icon, sort_order)
values
  ('Hair & Barber',           'hair-barber',           'scissors',  1),
  ('Nails & Beauty',          'nails-beauty',          'sparkles',  2),
  ('Make up & Glam',          'makeup-glam',           'palette',   3),
  ('Skincare & Aesthetics',   'skincare-aesthetics',   'droplet',   4),
  ('Spa & Massage',           'spa-massage',           'leaf',      5),
  ('Fitness & Wellness',      'fitness-wellness',      'heart',     6),
  ('At-Home/Mobile Services', 'at-home-mobile',        'home',      7)
on conflict (slug) do nothing;
