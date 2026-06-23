-- ============================================================================
-- Booking availability engine (part 2): indexes + reserve function
-- Depends on pending_hold enum value committed in the previous migration.
-- ============================================================================

-- 1. Partial index for fast conflict lookups
create index idx_bookings_active_staff_slot
  on bookings (staff_id, starts_at, ends_at)
  where status not in ('cancelled', 'no_show');

-- 2. Index for expired hold cleanup
create index idx_bookings_expired_holds
  on bookings (hold_expires_at)
  where status = 'pending_hold' and hold_expires_at is not null;

-- 3. Atomically reserve a slot (double-booking guard)
--    Advisory lock on staff_id serializes concurrent booking attempts.
create or replace function public.reserve_booking_slot(
  p_client_id       uuid,
  p_business_id     uuid,
  p_service_id      uuid,
  p_staff_id        uuid,
  p_staff_chosen    boolean,
  p_source          booking_source,
  p_starts_at       timestamptz,
  p_ends_at         timestamptz,
  p_payment_method  payment_method,
  p_service_amount  integer,
  p_platform_fee    integer,
  p_currency        text,
  p_client_note     text default null,
  p_hold_minutes    integer default 10
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking_id uuid;
  v_conflict_count integer;
begin
  -- Clean up expired holds for this staff member first
  delete from public.bookings
  where staff_id = p_staff_id
    and status = 'pending_hold'
    and hold_expires_at < now();

  -- Advisory lock keyed on staff_id to serialize concurrent attempts
  perform pg_advisory_xact_lock(
    ('x' || left(replace(p_staff_id::text, '-', ''), 16))::bit(64)::bigint
  );

  -- Check for overlapping active bookings (including unexpired holds)
  select count(*) into v_conflict_count
  from public.bookings
  where staff_id = p_staff_id
    and status not in ('cancelled', 'no_show')
    and starts_at < p_ends_at
    and ends_at > p_starts_at
    and (status != 'pending_hold' or hold_expires_at > now());

  if v_conflict_count > 0 then
    raise exception 'SLOT_TAKEN: This time slot is no longer available'
      using errcode = 'P0001';
  end if;

  insert into public.bookings (
    client_id, business_id, service_id, staff_id,
    staff_chosen_by_client, source,
    starts_at, ends_at,
    status, hold_expires_at,
    payment_method, service_amount, tip_amount, platform_fee_amount,
    currency, client_note
  ) values (
    p_client_id, p_business_id, p_service_id, p_staff_id,
    p_staff_chosen, p_source,
    p_starts_at, p_ends_at,
    'pending_hold', now() + (p_hold_minutes || ' minutes')::interval,
    p_payment_method, p_service_amount, 0, p_platform_fee,
    p_currency, p_client_note
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- 4. Grant execute to service_role only
grant execute on function public.reserve_booking_slot(
  uuid, uuid, uuid, uuid, boolean, booking_source,
  timestamptz, timestamptz, payment_method,
  integer, integer, text, text, integer
) to service_role;
