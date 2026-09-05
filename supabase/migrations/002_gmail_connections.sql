-- Gmail OAuth connections table
create table gmail_connections (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  gmail_email     text        not null,
  access_token    text        not null,
  refresh_token   text,
  token_expiry    timestamptz,
  last_scanned_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id)
);

-- Gmail scan log (tracks which thread IDs we've already processed)
create table gmail_processed_threads (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  thread_id   text        not null,
  processed_at timestamptz not null default now(),
  unique(user_id, thread_id)
);

create index idx_gmail_connections_user on gmail_connections (user_id);
create index idx_gmail_threads_user on gmail_processed_threads (user_id);

alter table gmail_connections enable row level security;
alter table gmail_processed_threads enable row level security;

create policy "gmail_connections: owner full access"
  on gmail_connections for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "gmail_processed_threads: owner full access"
  on gmail_processed_threads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
