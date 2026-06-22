-- ============================================================================
-- Zawadi — Enums & Tables (full schema from docs/zawadi-schema.md)
-- ============================================================================

---------------------------------------------------------------------------
-- Extensions
---------------------------------------------------------------------------
create extension if not exists moddatetime schema extensions;

---------------------------------------------------------------------------
-- Enums (Section 3)
---------------------------------------------------------------------------
create type platform_role        as enum ('user', 'super_admin');
create type verification_status  as enum ('pending', 'verified', 'suspended', 'rejected');
create type subscription_status  as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type staff_status         as enum ('invited', 'active', 'inactive');
create type payment_option       as enum ('prepay', 'pay_at_store', 'both');
create type payment_method       as enum ('prepay', 'pay_at_store');
create type booking_status       as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type booking_source       as enum ('marketplace', 'direct_link', 'manual');
create type plan_tier            as enum ('free', 'premium');
create type payment_status       as enum ('requires_payment', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded');
create type review_status        as enum ('published', 'flagged', 'removed');
create type dispute_status       as enum ('open', 'under_review', 'resolved', 'rejected');
-- REVIEW: notification_channel enum is defined in the schema doc but not used
-- as a column type (notification_preferences uses separate boolean columns).
-- Creating it for completeness; may be used in application logic.
create type notification_channel as enum ('in_app', 'email');

---------------------------------------------------------------------------
-- PASS 1 TABLES (referenced by Pass 2)
---------------------------------------------------------------------------

-- 4.1 profiles — extends auth.users 1:1
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  avatar_url      text,
  phone           text,
  country         text,
  platform_role   platform_role not null default 'user',
  stripe_customer_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.4 service_categories — global taxonomy, admin-managed
create table service_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  icon       text,
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.8 plans — must exist before businesses (businesses.plan_id FK)
create table plans (
  id              uuid primary key default gen_random_uuid(),
  tier            plan_tier not null unique, -- REVIEW: unique added; doc implies exactly one row per tier in v1
  name            text not null,
  base_price      integer not null default 0,
  per_seat_price  integer not null default 0,
  currency        text not null default 'usd',
  trial_days      int  not null default 0,
  stripe_price_id text,
  features        jsonb not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.2 businesses — the tenant
create table businesses (
  id                          uuid primary key default gen_random_uuid(),
  owner_id                    uuid not null references profiles(id) on delete cascade,
  name                        text not null,
  slug                        text not null unique,
  description                 text,
  primary_category_id         uuid references service_categories(id) on delete set null,
  phone                       text,
  email                       text,
  address                     text,
  city                        text,
  country                     text,
  latitude                    numeric,
  longitude                   numeric,
  logo_url                    text,
  cover_url                   text,
  gallery                     jsonb default '[]',
  amenities                   jsonb default '[]',
  default_payment_option      payment_option,
  commission_rate             numeric not null default 0.05,
  verification_status         verification_status not null default 'pending',
  stripe_connect_account_id   text,
  charges_enabled             boolean not null default false,
  payouts_enabled             boolean not null default false,
  stripe_billing_customer_id  text,
  plan_id                     uuid not null references plans(id),
  subscription_status         subscription_status, -- nullable: Free-only businesses have no subscription
  trial_ends_at               timestamptz,
  booking_link_token          text unique,
  is_featured                 boolean not null default false,
  featured_until              timestamptz,
  is_published                boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- 4.2 business_hours
create table business_hours (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid     not null references businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time   time,
  close_time  time,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4.3 staff
create table staff (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  user_id           uuid references profiles(id) on delete set null, -- nullable: null while invited
  invited_email     text,
  invite_token      text,
  invite_expires_at timestamptz,
  display_name      text not null,
  title             text,
  bio               text,
  avatar_url        text,
  status            staff_status not null default 'invited',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 4.4 services
create table services (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  category_id      uuid not null references service_categories(id) on delete restrict,
  name             text not null,
  description      text,
  price_amount     integer not null, -- minor units (cents)
  currency         text not null,
  duration_minutes int  not null,
  payment_option   payment_option not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 4.4 staff_services — capability map (composite PK)
create table staff_services (
  staff_id   uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (staff_id, service_id)
);

-- 4.5 staff_schedules — recurring weekly hours
create table staff_schedules (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid     not null references staff(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time     not null,
  end_time    time     not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4.5 schedule_exceptions — one-off blocks / added availability
create table schedule_exceptions (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references staff(id) on delete cascade,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  reason       text,
  is_available boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 4.6 bookings — center of the system
create table bookings (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references profiles(id),
  business_id           uuid not null references businesses(id),
  service_id            uuid not null references services(id),
  staff_id              uuid not null references staff(id),
  staff_chosen_by_client boolean not null default false,
  source                booking_source not null,
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  status                booking_status not null default 'pending',
  payment_method        payment_method not null,
  service_amount        integer not null,  -- minor units
  tip_amount            integer not null default 0,
  platform_fee_amount   integer not null default 0,
  currency              text not null,
  client_note           text,
  cancelled_by          uuid references profiles(id),
  cancellation_reason   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 4.8 subscriptions
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null unique references businesses(id) on delete cascade,
  plan_id                uuid not null references plans(id),
  stripe_subscription_id text,
  status                 subscription_status not null,
  seat_count             int not null default 1,
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

---------------------------------------------------------------------------
-- PASS 2 TABLES
---------------------------------------------------------------------------

-- 4.7 payments
create table payments (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null unique references bookings(id) on delete cascade,
  stripe_payment_intent_id text,
  amount                   integer not null, -- total charged = service + tip, minor units
  tip_amount               integer not null default 0,
  application_fee_amount   integer not null default 0,
  currency                 text not null,
  status                   payment_status not null default 'requires_payment',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- 4.7 refunds
create table refunds (
  id               uuid primary key default gen_random_uuid(),
  payment_id       uuid not null references payments(id) on delete cascade,
  stripe_refund_id text,
  amount           integer not null, -- supports partial
  reason           text,
  status           text not null, -- doc specifies text, not enum
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 4.7 payouts — read-only mirror of Stripe payouts
create table payouts (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  stripe_payout_id text,
  amount           integer not null,
  currency         text not null,
  status           text not null, -- doc specifies text, not enum
  arrival_date     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 4.9 reviews — one per completed booking
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references bookings(id) on delete cascade,
  client_id   uuid not null references profiles(id),
  business_id uuid not null references businesses(id),
  staff_id    uuid not null references staff(id),
  rating      smallint not null check (rating >= 1 and rating <= 5),
  comment     text,
  status      review_status not null default 'published',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4.9 review_responses
create table review_responses (
  id           uuid primary key default gen_random_uuid(),
  review_id    uuid not null unique references reviews(id) on delete cascade,
  responder_id uuid not null references profiles(id),
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 4.10 conversations
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  client_id       uuid not null references profiles(id),
  booking_id      uuid references bookings(id) on delete set null, -- nullable
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.10 messages
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id),
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4.10 conversation_participants (composite PK)
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  last_read_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- 4.11 notifications
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.11 notification_preferences (composite PK)
create table notification_preferences (
  user_id    uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  in_app     boolean not null default true,
  email      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_type)
);

-- 4.12 favorites (composite PK)
create table favorites (
  client_id   uuid not null references profiles(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (client_id, business_id)
);

-- 4.13 disputes
create table disputes (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id),
  raised_by   uuid not null references profiles(id),
  reason      text not null,
  status      dispute_status not null default 'open',
  resolution  text,
  resolved_by uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

---------------------------------------------------------------------------
-- Indexes (on FKs, lookup columns, and booking time ranges)
-- Note: UNIQUE / PK constraints already create btree indexes.
---------------------------------------------------------------------------

-- businesses
create index idx_businesses_owner_id            on businesses(owner_id);
create index idx_businesses_primary_category_id on businesses(primary_category_id);
create index idx_businesses_verification_status on businesses(verification_status) where is_published = true;

-- business_hours
create index idx_business_hours_business_id on business_hours(business_id);

-- staff
create index idx_staff_business_id on staff(business_id);
create index idx_staff_user_id     on staff(user_id);

-- services
create index idx_services_business_id on services(business_id);
create index idx_services_category_id on services(category_id);

-- staff_services: PK covers (staff_id, service_id); need reverse lookup
create index idx_staff_services_service_id on staff_services(service_id);

-- staff_schedules
create index idx_staff_schedules_staff_id on staff_schedules(staff_id);

-- schedule_exceptions
create index idx_schedule_exceptions_staff_id on schedule_exceptions(staff_id);

-- bookings
create index idx_bookings_client_id   on bookings(client_id);
create index idx_bookings_business_id on bookings(business_id);
create index idx_bookings_service_id  on bookings(service_id);
create index idx_bookings_staff_id    on bookings(staff_id);
create index idx_bookings_staff_time  on bookings(staff_id, starts_at, ends_at);

-- refunds
create index idx_refunds_payment_id on refunds(payment_id);

-- payouts
create index idx_payouts_business_id on payouts(business_id);

-- reviews
create index idx_reviews_business_id on reviews(business_id);
create index idx_reviews_client_id   on reviews(client_id);
create index idx_reviews_staff_id    on reviews(staff_id);

-- conversations
create index idx_conversations_business_id     on conversations(business_id);
create index idx_conversations_client_id       on conversations(client_id);
create index idx_conversations_booking_id      on conversations(booking_id);
create index idx_conversations_last_message_at on conversations(last_message_at desc);

-- conversation_participants: PK covers (conversation_id, user_id); need reverse lookup
create index idx_conversation_participants_user_id on conversation_participants(user_id);

-- messages
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_sender_id       on messages(sender_id);

-- notifications
create index idx_notifications_user_id  on notifications(user_id);
create index idx_notifications_unread   on notifications(user_id, read_at) where read_at is null;

-- favorites: PK covers (client_id, business_id); need reverse lookup
create index idx_favorites_business_id on favorites(business_id);

-- disputes
create index idx_disputes_booking_id on disputes(booking_id);
create index idx_disputes_raised_by  on disputes(raised_by);

---------------------------------------------------------------------------
-- updated_at triggers (moddatetime)
---------------------------------------------------------------------------
create trigger handle_updated_at before update on profiles               for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on service_categories     for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on plans                  for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on businesses             for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on business_hours         for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on staff                  for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on services               for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on staff_services         for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on staff_schedules        for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on schedule_exceptions    for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on bookings               for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on subscriptions          for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on payments               for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on refunds                for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on payouts                for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on reviews                for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on review_responses       for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on conversations          for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on messages               for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on conversation_participants for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on notifications          for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on notification_preferences  for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on favorites              for each row execute function extensions.moddatetime(updated_at);
create trigger handle_updated_at before update on disputes               for each row execute function extensions.moddatetime(updated_at);

---------------------------------------------------------------------------
-- Auto-create profile on auth.users insert
---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

---------------------------------------------------------------------------
-- Enable RLS on every table
---------------------------------------------------------------------------
alter table profiles                   enable row level security;
alter table service_categories         enable row level security;
alter table plans                      enable row level security;
alter table businesses                 enable row level security;
alter table business_hours             enable row level security;
alter table staff                      enable row level security;
alter table services                   enable row level security;
alter table staff_services             enable row level security;
alter table staff_schedules            enable row level security;
alter table schedule_exceptions        enable row level security;
alter table bookings                   enable row level security;
alter table subscriptions              enable row level security;
alter table payments                   enable row level security;
alter table refunds                    enable row level security;
alter table payouts                    enable row level security;
alter table reviews                    enable row level security;
alter table review_responses           enable row level security;
alter table conversations              enable row level security;
alter table messages                   enable row level security;
alter table conversation_participants  enable row level security;
alter table notifications              enable row level security;
alter table notification_preferences   enable row level security;
alter table favorites                  enable row level security;
alter table disputes                   enable row level security;

---------------------------------------------------------------------------
-- GRANTs — expose tables to Supabase API roles
---------------------------------------------------------------------------

-- authenticated users: all operations (RLS filters)
grant all on all tables in schema public to authenticated;

-- service_role: all operations (bypasses RLS)
grant all on all tables in schema public to service_role;

-- anon: SELECT only on public-facing tables
grant select on profiles             to anon; -- thin view TBD; RLS restricts to own row anyway
grant select on service_categories   to anon;
grant select on plans                to anon;
grant select on businesses           to anon;
grant select on business_hours       to anon;
grant select on staff                to anon;
grant select on services             to anon;
grant select on staff_services       to anon;
grant select on staff_schedules      to anon;
grant select on schedule_exceptions  to anon;
grant select on reviews              to anon;
grant select on review_responses     to anon;
