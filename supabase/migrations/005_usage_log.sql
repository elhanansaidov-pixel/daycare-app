-- ============================================================
--  U4: "העוזרת של ברכה" – usage log + learned profile
--  usage_log:        what the caregiver does in the app (screens, actions, undo, help questions, tours).
--                    No child names or event content – only action types and counts.
--  assistant_profile: what the assistant learned (one row per user) + weekly snapshots
--                    written by the weekly summary task.
--  Staff may only insert their own rows; only the admin reads the log.
-- ============================================================
create table if not exists public.usage_log (
  id bigint generated always as identity primary key,
  user_email text not null default lower(coalesce(auth.jwt() ->> 'email', '')),
  kind text not null check (kind in ('screen','action','undo','help_q','help_miss','tour','tip')),
  detail text not null default '' check (length(detail) <= 200),
  at timestamptz not null default now()
);
create index if not exists usage_log_user_at on public.usage_log (user_email, at desc);
alter table public.usage_log enable row level security;

drop policy if exists usage_log_insert on public.usage_log;
create policy usage_log_insert on public.usage_log for insert to authenticated
  with check (public.is_staff() and user_email = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists usage_log_admin_read on public.usage_log;
create policy usage_log_admin_read on public.usage_log for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'elhanansaidov@gmail.com');

create table if not exists public.assistant_profile (
  user_email text primary key default lower(coalesce(auth.jwt() ->> 'email', '')),
  profile jsonb not null default '{}'::jsonb,
  snapshots jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.assistant_profile enable row level security;

drop policy if exists assistant_profile_own on public.assistant_profile;
create policy assistant_profile_own on public.assistant_profile for all to authenticated
  using (public.is_staff() and user_email = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (public.is_staff() and user_email = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists assistant_profile_admin_read on public.assistant_profile;
create policy assistant_profile_admin_read on public.assistant_profile for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'elhanansaidov@gmail.com');
