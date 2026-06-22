-- ============================================================================
-- Zawadi — Seed data (idempotent; safe to re-run after migrations)
-- Runs on `supabase db reset` after migrations have already applied.
-- ============================================================================

-- Plans
insert into plans (tier, name, base_price, per_seat_price, currency, trial_days, stripe_price_id, features, is_active)
values
  (
    'free', 'Free', 0, 0, 'usd', 0, null,
    '{"bookable":false,"online_payments":false,"max_staff":0,"max_bookable_services":0,"messaging":false,"featured_eligible":false,"shareable_link":false}'::jsonb,
    true
  ),
  (
    'premium', 'Zawadi Pro', 0, 2999, 'usd', 14, null,
    '{"bookable":true,"online_payments":true,"max_staff":null,"max_bookable_services":null,"messaging":true,"featured_eligible":true,"shareable_link":true}'::jsonb,
    true
  )
on conflict (tier) do nothing;

-- Service Categories
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
