-- ============================================================================
-- Booking availability engine (part 1): timezone, enum, column
--
-- Postgres requires new enum values to be committed before they can be
-- referenced in indexes, CHECK constraints, or PL/pgSQL. So this migration
-- adds the enum value + columns, and the next migration creates indexes
-- and the reserve function.
-- ============================================================================

-- 1. Add timezone to businesses (IANA tz string, e.g. 'Africa/Nairobi')
alter table businesses
  add column timezone text not null default 'Africa/Nairobi';

-- 2. Add 'pending_hold' to booking_status enum
alter type booking_status add value 'pending_hold' before 'pending';

-- 3. Add hold_expires_at to bookings
alter table bookings
  add column hold_expires_at timestamptz;
