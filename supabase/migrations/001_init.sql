-- ============================================================
--  היומן של המשפחתון – סכמת בסיס נתונים
--  להריץ פעם אחת ב-Supabase > SQL Editor (בפרויקט חדש ונפרד!)
--  ⚠️ לפני ההרצה: להחליף את המייל בשורה האחרונה למייל של המטפלת
-- ============================================================

create extension if not exists pgcrypto;

-- מי מורשה לנהל (המטפלת). מזוהה לפי המייל שאיתו נכנסים.
create table if not exists public.staff_emails (
  email text primary key
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  value jsonb not null default '{}'::jsonb
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null default 'boy' check (gender in ('boy','girl')),
  birth_date date,
  color text not null default '#F59E8B',
  emoji text not null default '🧸',
  allergies text not null default '',
  medications text not null default '',
  notes text not null default '',
  diaper_alert_min int not null default 180,
  feed_alert_min int not null default 240,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  name text not null,
  relation text not null default '',
  phone text not null default '',
  email text not null default ''
);
create index if not exists guardians_email_idx on public.guardians (lower(email));

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  type text not null check (type in ('diaper','feed','sleep','note','attendance')),
  subtype text,
  data jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists events_started_idx on public.events (started_at);
create index if not exists events_child_idx on public.events (child_id, started_at);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text not null default '',
  taken_at timestamptz not null default now()
);
create index if not exists photos_taken_idx on public.photos (taken_at);

create table if not exists public.photo_children (
  photo_id uuid not null references public.photos(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (photo_id, child_id)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade,
  title text not null,
  time_of_day text not null,
  days int[] not null default '{0,1,2,3,4}',
  active boolean not null default true
);

-- ---------- פונקציות הרשאה ----------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_emails where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.can_view_child(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from guardians g
    where g.child_id = cid and g.email <> '' and lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.can_view_photo(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from photo_children pc where pc.photo_id = pid and public.can_view_child(pc.child_id)
  );
$$;

-- ---------- RLS ----------
alter table public.staff_emails   enable row level security;
alter table public.settings       enable row level security;
alter table public.children       enable row level security;
alter table public.guardians      enable row level security;
alter table public.events         enable row level security;
alter table public.photos         enable row level security;
alter table public.photo_children enable row level security;
alter table public.reminders      enable row level security;

-- staff_emails: אף אחד לא קורא/כותב דרך ה-API (רק דרך SQL Editor)

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists children_read on public.children;
create policy children_read on public.children for select to authenticated using (public.can_view_child(id));
drop policy if exists children_write on public.children;
create policy children_write on public.children for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists guardians_read on public.guardians;
create policy guardians_read on public.guardians for select to authenticated using (public.is_staff());
drop policy if exists guardians_write on public.guardians;
create policy guardians_write on public.guardians for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated using (public.can_view_child(child_id));
drop policy if exists events_write on public.events;
create policy events_write on public.events for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists photos_read on public.photos;
create policy photos_read on public.photos for select to authenticated using (public.can_view_photo(id));
drop policy if exists photos_write on public.photos;
create policy photos_write on public.photos for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists photo_children_read on public.photo_children;
create policy photo_children_read on public.photo_children for select to authenticated using (public.can_view_child(child_id));
drop policy if exists photo_children_write on public.photo_children;
create policy photo_children_write on public.photo_children for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists reminders_all on public.reminders;
create policy reminders_all on public.reminders for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------- אחסון תמונות (bucket פרטי) ----------
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists photos_obj_read on storage.objects;
create policy photos_obj_read on storage.objects for select to authenticated using (
  bucket_id = 'photos' and (
    public.is_staff() or exists (
      select 1 from public.photos p where p.storage_path = storage.objects.name and public.can_view_photo(p.id)
    )
  )
);
drop policy if exists photos_obj_write on storage.objects;
create policy photos_obj_write on storage.objects for insert to authenticated with check (bucket_id = 'photos' and public.is_staff());
drop policy if exists photos_obj_delete on storage.objects;
create policy photos_obj_delete on storage.objects for delete to authenticated using (bucket_id = 'photos' and public.is_staff());

-- ---------- Realtime (עדכונים חיים להורים ולמכשירים נוספים) ----------
do $$ begin
  alter publication supabase_realtime add table public.events, public.photos, public.photo_children, public.children, public.reminders;
exception when duplicate_object then null; end $$;

-- ---------- נתוני התחלה ----------
insert into public.settings (id, value) values (1, '{"daycare_name":"המשפחתון","caregiver_name":""}')
on conflict (id) do nothing;

insert into public.children (name, gender, color, emoji, sort)
select * from (values
  ('כפיר','boy','#F59E8B','🦁',0),
  ('ליבי','boy','#7CC6B6','🐳',1),
  ('אור','girl','#F6C25B','🐥',2),
  ('מיכל','girl','#E89BD0','🦋',3),
  ('מיתר','girl','#9AA8F5','🐰',4),
  ('נטע','boy','#8CCB7E','🐻',5)
) v(name, gender, color, emoji, sort)
where not exists (select 1 from public.children);

-- ⚠️ להחליף למייל של המטפלת:
insert into public.staff_emails (email) values (lower('MOM_EMAIL@example.com'))
on conflict do nothing;
