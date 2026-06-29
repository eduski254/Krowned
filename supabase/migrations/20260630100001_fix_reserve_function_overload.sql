-- Drop the old reserve_booking_slot overload (14 params, no p_contact_id)
-- to avoid ambiguous function resolution when calling without p_contact_id.
drop function if exists public.reserve_booking_slot(
  uuid, uuid, uuid, uuid, boolean, booking_source,
  timestamptz, timestamptz, payment_method,
  integer, integer, text, text, integer
);
