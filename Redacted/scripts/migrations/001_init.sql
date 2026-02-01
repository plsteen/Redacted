-- Core tables
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  created_at timestamptz default now()
);

create table if not exists mysteries (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  difficulty text check (difficulty in ('easy','medium','hard')) not null,
  estimated_minutes int,
  is_published boolean default false
);

create table if not exists mystery_locales (
  id uuid primary key default uuid_generate_v4(),
  mystery_id uuid references mysteries(id) on delete cascade,
  lang text not null,
  title text not null,
  tagline text,
  description text,
  unique (mystery_id, lang)
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  mystery_id uuid references mysteries(id) on delete cascade,
  idx int not null,
  type text not null,
  is_final boolean default false,
  unique (mystery_id, idx)
);

create table if not exists task_locales (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  lang text not null,
  question_text text not null,
  options jsonb default '[]'::jsonb,
  hint_text text,
  unique (task_id, lang)
);

create table if not exists evidence (
  id uuid primary key default uuid_generate_v4(),
  mystery_id uuid references mysteries(id) on delete cascade,
  type text not null,
  storage_path text not null,
  unlocked_on_task_id uuid references tasks(id),
  has_transcript boolean default false
);

create table if not exists evidence_locales (
  id uuid primary key default uuid_generate_v4(),
  evidence_id uuid references evidence(id) on delete cascade,
  lang text not null,
  title text not null,
  content text,
  unique (evidence_id, lang)
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  mystery_id uuid references mysteries(id),
  language text default 'en',
  host_user_id uuid references users(id),
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists session_players (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references users(id),
  joined_at timestamptz default now(),
  device_type text,
  unique (session_id, user_id)
);

create table if not exists session_progress (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  task_id uuid references tasks(id),
  status text default 'pending',
  hints_used int default 0,
  answer_payload jsonb,
  solved_at timestamptz,
  unique (session_id, task_id)
);

create table if not exists tv_board (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  pinned_items jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  mystery_id uuid references mysteries(id),
  platform text,
  amount numeric,
  currency text,
  region text,
  purchased_at timestamptz default now()
);

create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references users(id),
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_tasks_mystery on tasks (mystery_id, idx);
create index if not exists idx_evidence_mystery on evidence (mystery_id);
create index if not exists idx_session_progress on session_progress (session_id, task_id);
create index if not exists idx_session_players on session_players (session_id, user_id);

-- RLS policies
alter table sessions enable row level security;
alter table session_players enable row level security;
alter table session_progress enable row level security;
alter table tv_board enable row level security;
alter table analytics_events enable row level security;

create policy "players can read their session" on sessions
  for select using (id in (
    select session_id from session_players where user_id = auth.uid()
  ));

create policy "players can read progress" on session_progress
  for select using (session_id in (
    select session_id from session_players where user_id = auth.uid()
  ));

create policy "players can update progress" on session_progress
  for update using (session_id in (
    select session_id from session_players where user_id = auth.uid()
  ));

create policy "players can read board" on tv_board
  for select using (session_id in (
    select session_id from session_players where user_id = auth.uid()
  ));

create policy "players can update board" on tv_board
  for update using (session_id in (
    select session_id from session_players where user_id = auth.uid()
  ));

create policy "players can read analytics" on analytics_events
  for select using (session_id in (
    select session_id from session_players where user_id = auth.uid()
  ));

create policy "players insert analytics" on analytics_events
  for insert with check (session_id in (
    select session_id from session_players where user_id = auth.uid()
  ));
