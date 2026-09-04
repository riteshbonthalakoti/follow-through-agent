-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- Enum type for loop state
-- ─────────────────────────────────────────────────────────────────
create type loop_state as enum (
  'waiting',
  'due',
  'overdue',
  'escalated',
  'closed'
);

-- ─────────────────────────────────────────────────────────────────
-- Loops table
-- ─────────────────────────────────────────────────────────────────
create table loops (
  id              uuid          primary key default gen_random_uuid(),
  owner_id        uuid          not null references auth.users(id) on delete cascade,
  description     text          not null,
  counterparty    text          not null,
  direction       text          not null check (direction in ('inbound', 'outbound')),
  source          text          not null check (source in ('email', 'manual', 'voice')),
  source_ref      text,
  created_at      timestamptz   not null default now(),
  expected_by     timestamptz   not null,
  state           loop_state    not null default 'waiting',
  last_action_at  timestamptz   not null default now(),
  next_action     text,
  confidence      numeric(3,2)  not null default 1.0 check (confidence >= 0 and confidence <= 1),
  nudge_count     integer       not null default 0
);

-- ─────────────────────────────────────────────────────────────────
-- Push subscriptions table (needed by /api/push/subscribe)
-- ─────────────────────────────────────────────────────────────────
create table push_subscriptions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  endpoint     text        not null unique,
  subscription jsonb       not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────
create index idx_loops_owner_id    on loops (owner_id);
create index idx_loops_state       on loops (state);
create index idx_loops_expected_by on loops (expected_by);
create index idx_push_user_id      on push_subscriptions (user_id);

-- ─────────────────────────────────────────────────────────────────
-- Trigger: auto-update last_action_at on row update
-- ─────────────────────────────────────────────────────────────────
create or replace function set_last_action_at()
returns trigger as $$
begin
  new.last_action_at = now();
  return new;
end;
$$ language plpgsql;

create trigger loops_last_action_at
  before update on loops
  for each row
  execute function set_last_action_at();

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────
alter table loops enable row level security;
alter table push_subscriptions enable row level security;

-- Users can only access their own loops
create policy "loops: owner full access"
  on loops
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Users can only access their own push subscriptions
create policy "push_subscriptions: owner full access"
  on push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
