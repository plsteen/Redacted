-- ============================================================
-- ANALYTICS TABLES (Scalable for future payment integration)
-- ============================================================

-- Session-level analytics: one row per completed playthrough
create table if not exists session_analytics (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null,
  session_code text,
  player_name text not null,
  total_time_seconds int not null,
  hints_used int default 0,
  tasks_completed int default 0,
  rating int check (rating between 1 and 5),
  comment text,
  completed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Task-level analytics: granular data for each task in a session
create table if not exists task_completion_log (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references session_analytics(id) on delete cascade,
  case_id text not null,
  task_idx int not null,
  time_spent_seconds int not null,
  hints_used int default 0,
  attempts int default 1,
  completed_at timestamptz default now()
);

-- Legacy feedback table (kept for backward compatibility)
create table if not exists case_feedback (
  id uuid primary key default uuid_generate_v4(),
  case_id text not null,
  session_code text,
  rating int check (rating between 1 and 5),
  comment text,
  time_spent int,
  hints_used int,
  player_name text,
  submitted_at timestamptz default now()
);

-- ============================================================
-- INDEXES (for query performance at scale)
-- ============================================================

create index if not exists idx_session_analytics_case on session_analytics (case_id, completed_at desc);
create index if not exists idx_session_analytics_date on session_analytics (completed_at desc);
create index if not exists idx_task_completion_session on task_completion_log (session_id);
create index if not exists idx_task_completion_case_task on task_completion_log (case_id, task_idx);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table session_analytics enable row level security;
alter table task_completion_log enable row level security;
alter table case_feedback enable row level security;

-- Anyone can insert analytics (unauthenticated players)
create policy "anyone can insert session analytics" on session_analytics
  for insert with check (true);

create policy "anyone can insert task completion" on task_completion_log
  for insert with check (true);

create policy "anyone can insert feedback" on case_feedback
  for insert with check (true);

-- Admin read access (in production: use proper auth instead of query param)
create policy "public read session analytics" on session_analytics
  for select using (true);

create policy "public read task completion" on task_completion_log
  for select using (true);

create policy "public read feedback" on case_feedback
  for select using (true);

-- ============================================================
-- TABLE COMMENTS
-- ============================================================

comment on table session_analytics is 'One row per completed case playthrough. Scalable foundation for future payment/subscription integration';
comment on column session_analytics.session_code is 'Multiplayer session ID (nullable for solo play)';
comment on column session_analytics.tasks_completed is 'Number of tasks solved in this session';

comment on table task_completion_log is 'Granular task-level analytics. Enables "where do players struggle" analysis';
comment on column task_completion_log.session_id is 'Link to parent session';
comment on column task_completion_log.attempts is 'Number of wrong answers before solving';
