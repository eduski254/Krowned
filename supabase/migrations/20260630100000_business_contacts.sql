-- ============================================================================
-- Business contacts: lightweight client records for manual bookings.
-- A contact is business-scoped, NOT an auth account.
-- ============================================================================

-- 1. Create business_contacts table
create table business_contacts (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  name            text not null,
  phone           text,
  email           text,
  linked_profile_id uuid references profiles(id),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Require at least one of phone or email
  constraint contacts_require_phone_or_email check (phone is not null or email is not null)
);

-- Index for fast lookup by business + search
create index idx_business_contacts_business on business_contacts (business_id);
create index idx_business_contacts_phone on business_contacts (business_id, phone) where phone is not null;
create index idx_business_contacts_email on business_contacts (business_id, email) where email is not null;

-- Unique constraint: within a business, no two contacts with the same email
create unique index idx_business_contacts_unique_email
  on business_contacts (business_id, lower(email))
  where email is not null;

-- Unique constraint: within a business, no two contacts with the same phone
create unique index idx_business_contacts_unique_phone
  on business_contacts (business_id, phone)
  where phone is not null;

-- 2. Add contact_id to bookings for manual bookings (nullable)
alter table bookings add column contact_id uuid references business_contacts(id);

-- 3. Make client_id nullable (manual bookings may have no auth account)
alter table bookings alter column client_id drop not null;

-- 4. Ensure every booking has either a client_id OR contact_id
alter table bookings add constraint bookings_require_client_or_contact
  check (client_id is not null or contact_id is not null);

-- 5. RLS on business_contacts
alter table business_contacts enable row level security;

-- Owner can manage contacts for their business
create policy "Owner manages own business contacts" on business_contacts
  for all using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Staff can read contacts for their business
create policy "Staff reads business contacts" on business_contacts
  for select using (
    business_id in (
      select business_id from staff where user_id = auth.uid() and status = 'active'
    )
  );

-- Super admin full access
create policy "Admin full access to contacts" on business_contacts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and platform_role = 'super_admin')
  );

-- 6. Grant access to authenticated users (RLS handles scoping)
grant select, insert, update, delete on business_contacts to authenticated;
grant select on business_contacts to anon;

-- 7. Update reserve_booking_slot to accept nullable client_id + contact_id
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
  p_hold_minutes    integer default 10,
  p_contact_id      uuid default null
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
    currency, client_note, contact_id
  ) values (
    p_client_id, p_business_id, p_service_id, p_staff_id,
    p_staff_chosen, p_source,
    p_starts_at, p_ends_at,
    'pending_hold', now() + (p_hold_minutes || ' minutes')::interval,
    p_payment_method, p_service_amount, 0, p_platform_fee,
    p_currency, p_client_note, p_contact_id
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- Re-grant (new signature)
grant execute on function public.reserve_booking_slot(
  uuid, uuid, uuid, uuid, boolean, booking_source,
  timestamptz, timestamptz, payment_method,
  integer, integer, text, text, integer, uuid
) to service_role;
