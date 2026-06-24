-- Add checked_in_at to bookings for appointment check-in tracking
alter table bookings add column checked_in_at timestamptz;

-- Index for finding bookings that need check-in (confirmed, not yet checked in)
create index idx_bookings_pending_checkin
  on bookings (business_id, starts_at)
  where status = 'confirmed' and checked_in_at is null;
