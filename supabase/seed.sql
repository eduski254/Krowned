-- ============================================================================
-- Krowned — Seed data (idempotent; safe to re-run after migrations)
-- Runs on `supabase db reset` after migrations have already applied.
-- ============================================================================

-- Plans (unchanged — Free / Starter $15 / Pro $25 / Enterprise $49)
insert into plans (tier, name, base_price, per_seat_price, currency, trial_days, stripe_price_id, features, is_active)
values
  (
    'free', 'Free', 0, 0, 'usd', 0, null,
    '{"bookable":false,"online_payments":false,"max_staff":0,"max_bookable_services":0,"messaging":false,"featured_eligible":false,"shareable_link":false}'::jsonb,
    true
  ),
  (
    'premium', 'Krowned Pro', 0, 2999, 'usd', 14, null,
    '{"bookable":true,"online_payments":true,"max_staff":null,"max_bookable_services":null,"messaging":true,"featured_eligible":true,"shareable_link":true}'::jsonb,
    true
  )
on conflict (tier) do nothing;

-- Service Categories (textured-hair niche)
insert into service_categories (name, slug, icon, sort_order)
values
  ('Braids & Protective Styling', 'braids-protective',  'sparkles',  1),
  ('Locs',                        'locs',               'waves',     2),
  ('Natural Hair & Silk Press',   'natural-silk-press',  'flower2',   3),
  ('Weaves & Extensions',        'weaves-extensions',   'gem',       4),
  ('Barbering & Cuts',            'barbering-cuts',      'scissors',  5),
  ('Color',                       'color',               'palette',   6)
on conflict (slug) do nothing;
