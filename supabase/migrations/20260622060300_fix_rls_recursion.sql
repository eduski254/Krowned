-- ============================================================================
-- Fix infinite RLS recursion between businesses <-> staff policies
--
-- The "Staff reads their business" policy on businesses queries staff,
-- and staff's "Public reads active staff" policy queries businesses,
-- causing infinite recursion. Fix: use a security-definer helper that
-- bypasses RLS to check staff membership.
-- ============================================================================

-- Helper: check if current user is active staff of a given business
-- Security definer bypasses RLS, breaking the cycle.
create or replace function public.is_staff_of(business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where staff.business_id = is_staff_of.business_id
      and staff.user_id = auth.uid()
      and staff.status = 'active'
  );
$$;

-- Drop the recursive policy and replace it
drop policy if exists "Staff reads their business" on businesses;

create policy "Staff reads their business"
  on businesses for select
  to authenticated
  using (public.is_staff_of(id));
