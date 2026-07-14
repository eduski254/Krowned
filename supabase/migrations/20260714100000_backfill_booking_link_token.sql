-- Backfill booking_link_token for businesses created without one
UPDATE businesses
SET booking_link_token = gen_random_uuid()::text
WHERE booking_link_token IS NULL;
