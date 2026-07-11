-- Add flag to track whether the 24h reminder has been sent for a booking.
-- This prevents duplicate sends when the cron runs multiple times.
alter table bookings add column if not exists reminder_24h_sent boolean not null default false;

-- Index for the cron query: confirmed bookings in the next 24-25h window that haven't been reminded
create index if not exists idx_bookings_reminder_pending
  on bookings (starts_at)
  where status = 'confirmed' and reminder_24h_sent = false;
