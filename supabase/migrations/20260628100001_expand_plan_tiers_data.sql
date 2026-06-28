-- Step 2: Migrate plan data from (free, premium) to (free, starter, pro, enterprise).
-- Depends on enum values added in 20260628100000.

-- Drop the UNIQUE constraint on tier (we now have multiple paid tiers)
alter table plans drop constraint if exists plans_tier_key;

-- Rename the existing "premium" row to "pro" and update its pricing
update plans
set tier = 'pro',
    name = 'Pro',
    per_seat_price = 2500,  -- $25.00/month
    trial_days = 14
where tier = 'premium';

-- Insert Starter plan
insert into plans (tier, name, base_price, per_seat_price, currency, trial_days, stripe_price_id, features, is_active)
values (
  'starter',
  'Starter',
  0,
  1500,    -- $15.00/month
  'usd',
  14,
  null,    -- set via app after reading STRIPE_PRICE_STARTER env var
  '{
    "bookable": true,
    "online_payments": true,
    "max_staff": 1,
    "max_bookable_services": 5,
    "messaging": false,
    "featured_eligible": false,
    "shareable_link": true
  }'::jsonb,
  true
);

-- Insert Enterprise plan
insert into plans (tier, name, base_price, per_seat_price, currency, trial_days, stripe_price_id, features, is_active)
values (
  'enterprise',
  'Enterprise',
  0,
  4900,    -- $49.00/month
  'usd',
  14,
  null,    -- set via app after reading STRIPE_PRICE_ENTERPRISE env var
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
);

-- Update Pro features to differentiate from Enterprise
update plans
set features = '{
  "bookable": true,
  "online_payments": true,
  "max_staff": 10,
  "max_bookable_services": null,
  "messaging": true,
  "featured_eligible": false,
  "shareable_link": true
}'::jsonb
where tier = 'pro';
