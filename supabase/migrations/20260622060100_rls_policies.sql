-- ============================================================================
-- Zawadi — Row Level Security Policies
-- Per docs/zawadi-schema.md Section 6 "RLS strategy summary"
-- ============================================================================

---------------------------------------------------------------------------
-- Helper: check if current user is super_admin
---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and platform_role = 'super_admin'
  );
$$;

-- =========================================================================
-- PROFILES
-- "a user reads/updates only their own row. Super admin reads all."
-- =========================================================================

create policy "Users can read own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Super admin reads all profiles"
  on profiles for select
  to authenticated
  using (public.is_super_admin());

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Super admin updates any profile"
  on profiles for update
  to authenticated
  using (public.is_super_admin());

-- Service role handles inserts via handle_new_user trigger.
-- No anon SELECT policy on profiles; public bio data uses a view (TBD).

-- =========================================================================
-- SERVICE_CATEGORIES
-- "public read; super admin write"
-- =========================================================================

create policy "Anyone can read categories"
  on service_categories for select
  to anon, authenticated
  using (true);

create policy "Super admin manages categories"
  on service_categories for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- PLANS
-- "public read active plans; super admin write"
-- =========================================================================

create policy "Anyone can read active plans"
  on plans for select
  to anon, authenticated
  using (is_active = true);

create policy "Super admin manages plans"
  on plans for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- BUSINESSES
-- "public reads verified+published; owner reads/writes own; staff reads;
--  super admin full"
-- =========================================================================

create policy "Public reads verified published businesses"
  on businesses for select
  to anon, authenticated
  using (verification_status = 'verified' and is_published = true);

create policy "Owner reads own businesses"
  on businesses for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Staff reads their business"
  on businesses for select
  to authenticated
  using (
    exists (
      select 1 from staff s
      where s.business_id = businesses.id
        and s.user_id = auth.uid()
        and s.status = 'active'
    )
  );

create policy "Owner inserts businesses"
  on businesses for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owner updates own businesses"
  on businesses for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Super admin full access to businesses"
  on businesses for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- BUSINESS_HOURS
-- "public read for verified businesses; owner write"
-- =========================================================================

create policy "Public reads hours of verified businesses"
  on business_hours for select
  to anon, authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = business_hours.business_id
        and b.verification_status = 'verified'
        and b.is_published = true
    )
  );

create policy "Owner manages business hours"
  on business_hours for all
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = business_hours.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from businesses b
      where b.id = business_hours.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to business_hours"
  on business_hours for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- STAFF
-- "public reads active staff of verified businesses; owner manages all
--  staff of their business; staff user reads/updates own row; super admin full"
-- =========================================================================

create policy "Public reads active staff of verified businesses"
  on staff for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from businesses b
      where b.id = staff.business_id
        and b.verification_status = 'verified'
        and b.is_published = true
    )
  );

create policy "Owner manages staff of their business"
  on staff for all
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = staff.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from businesses b
      where b.id = staff.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Staff reads own staff row"
  on staff for select
  to authenticated
  using (user_id = auth.uid());

create policy "Staff updates own staff row"
  on staff for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Super admin full access to staff"
  on staff for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- SERVICES
-- "public read (active, verified businesses); owner write"
-- =========================================================================

create policy "Public reads active services of verified businesses"
  on services for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from businesses b
      where b.id = services.business_id
        and b.verification_status = 'verified'
        and b.is_published = true
    )
  );

create policy "Owner manages services"
  on services for all
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = services.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from businesses b
      where b.id = services.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to services"
  on services for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- STAFF_SERVICES
-- "public read (needed to compute availability); owner write"
-- =========================================================================

create policy "Public reads staff_services"
  on staff_services for select
  to anon, authenticated
  using (true);

create policy "Owner manages staff_services"
  on staff_services for all
  to authenticated
  using (
    exists (
      select 1 from staff st
        join businesses b on b.id = st.business_id
      where st.id = staff_services.staff_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from staff st
        join businesses b on b.id = st.business_id
      where st.id = staff_services.staff_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to staff_services"
  on staff_services for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- STAFF_SCHEDULES
-- "staff user manages own; owner manages business staff; public reads"
-- =========================================================================

create policy "Public reads staff_schedules"
  on staff_schedules for select
  to anon, authenticated
  using (true);

create policy "Staff manages own schedules"
  on staff_schedules for all
  to authenticated
  using (
    exists (
      select 1 from staff s
      where s.id = staff_schedules.staff_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from staff s
      where s.id = staff_schedules.staff_id
        and s.user_id = auth.uid()
    )
  );

create policy "Owner manages staff schedules"
  on staff_schedules for all
  to authenticated
  using (
    exists (
      select 1 from staff st
        join businesses b on b.id = st.business_id
      where st.id = staff_schedules.staff_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from staff st
        join businesses b on b.id = st.business_id
      where st.id = staff_schedules.staff_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to staff_schedules"
  on staff_schedules for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- SCHEDULE_EXCEPTIONS
-- Same as staff_schedules
-- =========================================================================

create policy "Public reads schedule_exceptions"
  on schedule_exceptions for select
  to anon, authenticated
  using (true);

create policy "Staff manages own exceptions"
  on schedule_exceptions for all
  to authenticated
  using (
    exists (
      select 1 from staff s
      where s.id = schedule_exceptions.staff_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from staff s
      where s.id = schedule_exceptions.staff_id
        and s.user_id = auth.uid()
    )
  );

create policy "Owner manages staff exceptions"
  on schedule_exceptions for all
  to authenticated
  using (
    exists (
      select 1 from staff st
        join businesses b on b.id = st.business_id
      where st.id = schedule_exceptions.staff_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from staff st
        join businesses b on b.id = st.business_id
      where st.id = schedule_exceptions.staff_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to schedule_exceptions"
  on schedule_exceptions for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- BOOKINGS
-- "client reads own; owner reads business bookings; staff reads assigned;
--  super admin full. Writes go through server-side (service_role)."
-- =========================================================================

create policy "Client reads own bookings"
  on bookings for select
  to authenticated
  using (client_id = auth.uid());

create policy "Owner reads business bookings"
  on bookings for select
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = bookings.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Staff reads assigned bookings"
  on bookings for select
  to authenticated
  using (
    exists (
      select 1 from staff s
      where s.id = bookings.staff_id
        and s.user_id = auth.uid()
    )
  );

create policy "Super admin full access to bookings"
  on bookings for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- No INSERT/UPDATE/DELETE policies for non-admin; writes use service_role.

-- =========================================================================
-- SUBSCRIPTIONS
-- "owner reads own; super admin full; writes webhook-driven (service_role)"
-- =========================================================================

create policy "Owner reads own subscription"
  on subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = subscriptions.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to subscriptions"
  on subscriptions for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- PAYMENTS
-- "owner reads business rows; staff no access; super admin full.
--  All writes webhook-driven (service_role)."
-- =========================================================================

create policy "Owner reads business payments"
  on payments for select
  to authenticated
  using (
    exists (
      select 1 from bookings bk
        join businesses b on b.id = bk.business_id
      where bk.id = payments.booking_id
        and b.owner_id = auth.uid()
    )
  );

-- REVIEW: clients can also read their own payment for receipt/history purposes.
create policy "Client reads own payments"
  on payments for select
  to authenticated
  using (
    exists (
      select 1 from bookings bk
      where bk.id = payments.booking_id
        and bk.client_id = auth.uid()
    )
  );

create policy "Super admin full access to payments"
  on payments for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- REFUNDS
-- "owner reads business rows; super admin full"
-- =========================================================================

create policy "Owner reads business refunds"
  on refunds for select
  to authenticated
  using (
    exists (
      select 1 from payments p
        join bookings bk on bk.id = p.booking_id
        join businesses b on b.id = bk.business_id
      where p.id = refunds.payment_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to refunds"
  on refunds for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- PAYOUTS
-- "owner reads business rows; super admin full"
-- =========================================================================

create policy "Owner reads business payouts"
  on payouts for select
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = payouts.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to payouts"
  on payouts for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- REVIEWS
-- "public reads published; client writes for own completed booking;
--  super admin moderates"
-- =========================================================================

create policy "Public reads published reviews"
  on reviews for select
  to anon, authenticated
  using (status = 'published');

create policy "Client inserts review for own completed booking"
  on reviews for insert
  to authenticated
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from bookings bk
      where bk.id = reviews.booking_id
        and bk.client_id = auth.uid()
        and bk.status = 'completed'
    )
  );

create policy "Client reads own reviews (any status)"
  on reviews for select
  to authenticated
  using (client_id = auth.uid());

create policy "Owner reads reviews of their business"
  on reviews for select
  to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.id = reviews.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to reviews"
  on reviews for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- REVIEW_RESPONSES
-- "public reads (for published reviews); owner/staff write responses
--  to reviews of their business"
-- =========================================================================

create policy "Public reads review responses"
  on review_responses for select
  to anon, authenticated
  using (
    exists (
      select 1 from reviews r
      where r.id = review_responses.review_id
        and r.status = 'published'
    )
  );

create policy "Owner or staff inserts response to business review"
  on review_responses for insert
  to authenticated
  with check (
    responder_id = auth.uid()
    and exists (
      select 1 from reviews r
        join businesses b on b.id = r.business_id
      where r.id = review_responses.review_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1 from staff s
            where s.business_id = b.id
              and s.user_id = auth.uid()
              and s.status = 'active'
          )
        )
    )
  );

create policy "Super admin full access to review_responses"
  on review_responses for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- CONVERSATIONS
-- "a user reads a conversation only if they are in conversation_participants"
-- =========================================================================

create policy "Participants read conversations"
  on conversations for select
  to authenticated
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

create policy "Super admin full access to conversations"
  on conversations for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- MESSAGES
-- "a user reads messages only if they are in conversation_participants;
--  participants can send messages"
-- =========================================================================

create policy "Participants read messages"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Participants send messages"
  on messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Super admin full access to messages"
  on messages for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- CONVERSATION_PARTICIPANTS
-- "a user reads only their own participation rows"
-- =========================================================================

create policy "User reads own participation"
  on conversation_participants for select
  to authenticated
  using (user_id = auth.uid());

create policy "User updates own last_read_at"
  on conversation_participants for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Super admin full access to conversation_participants"
  on conversation_participants for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- NOTIFICATIONS
-- "user reads only their own rows"
-- =========================================================================

create policy "User reads own notifications"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "User updates own notifications (mark read)"
  on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Super admin full access to notifications"
  on notifications for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================================
-- NOTIFICATION_PREFERENCES
-- "user reads/writes only their own rows"
-- =========================================================================

create policy "User manages own notification preferences"
  on notification_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- FAVORITES
-- "user manages their own"
-- =========================================================================

create policy "User manages own favorites"
  on favorites for all
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- =========================================================================
-- DISPUTES
-- "raiser and counter-party (business owner) read; super admin manages all"
-- =========================================================================

create policy "Raiser reads own disputes"
  on disputes for select
  to authenticated
  using (raised_by = auth.uid());

create policy "Business owner reads disputes on their bookings"
  on disputes for select
  to authenticated
  using (
    exists (
      select 1 from bookings bk
        join businesses b on b.id = bk.business_id
      where bk.id = disputes.booking_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Authenticated users can raise a dispute"
  on disputes for insert
  to authenticated
  with check (raised_by = auth.uid());

create policy "Super admin full access to disputes"
  on disputes for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
