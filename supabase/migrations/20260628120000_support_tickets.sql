-- Support ticket system
-- Users submit tickets, super admins manage and respond.

-- Enums
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');
create type ticket_category as enum (
  'billing', 'booking', 'account', 'technical', 'feature_request', 'other'
);

-- Tickets
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  category ticket_category not null default 'other',
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'open',
  assigned_to uuid references profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ticket messages (conversation thread)
create table support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  is_staff_reply boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_tickets_user on support_tickets(user_id);
create index idx_tickets_status on support_tickets(status);
create index idx_tickets_assigned on support_tickets(assigned_to);
create index idx_ticket_messages_ticket on support_ticket_messages(ticket_id);

-- RLS
alter table support_tickets enable row level security;
alter table support_ticket_messages enable row level security;

-- Users can read their own tickets
create policy "Users read own tickets"
  on support_tickets for select
  using (user_id = auth.uid() or exists(select 1 from profiles where id = auth.uid() and platform_role = 'super_admin'));

-- Users can insert tickets
create policy "Users create tickets"
  on support_tickets for insert
  with check (user_id = auth.uid());

-- Super admins can update tickets (status, priority, assignment)
create policy "Admins update tickets"
  on support_tickets for update
  using (exists(select 1 from profiles where id = auth.uid() and platform_role = 'super_admin'));

-- Message read: ticket owner + super admins
create policy "Read ticket messages"
  on support_ticket_messages for select
  using (
    exists(select 1 from support_tickets where id = ticket_id and user_id = auth.uid())
    or exists(select 1 from profiles where id = auth.uid() and platform_role = 'super_admin')
  );

-- Message insert: ticket owner or super admin
create policy "Insert ticket messages"
  on support_ticket_messages for insert
  with check (
    sender_id = auth.uid()
    and (
      exists(select 1 from support_tickets where id = ticket_id and user_id = auth.uid())
      or exists(select 1 from profiles where id = auth.uid() and platform_role = 'super_admin')
    )
  );

-- Grant access
grant select, insert on support_tickets to authenticated;
grant update on support_tickets to authenticated;
grant select, insert on support_ticket_messages to authenticated;

-- Updated_at trigger
create or replace function update_support_ticket_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_support_tickets
  before update on support_tickets
  for each row execute function update_support_ticket_updated_at();
