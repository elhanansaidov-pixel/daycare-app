-- ============================================================
--  U1: "מה חסר" – things the parents should bring (per child)
--  Stored as children.supplies: [{ "id", "text", "added_at" }]
--  Staff write it (children_write), parents read it (children_read).
--
--  (Released 16/11/2026: the guard below was dropped by 006_release_u1.sql.)
--  PILOT: while U1 is in pilot, only the admin account may change the list.
--  On release, run:  drop trigger if exists supplies_pilot_guard on public.children;
--                    drop function if exists public.supplies_pilot_guard();
-- ============================================================
alter table public.children add column if not exists supplies jsonb not null default '[]'::jsonb;

create or replace function public.supplies_pilot_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.supplies is distinct from old.supplies
     and lower(coalesce(auth.jwt() ->> 'email', '')) <> 'elhanansaidov@gmail.com'
     and auth.role() <> 'service_role' then
    raise exception 'supplies is in pilot (admin only)';
  end if;
  return new;
end $$;

drop trigger if exists supplies_pilot_guard on public.children;
create trigger supplies_pilot_guard before update on public.children
  for each row execute function public.supplies_pilot_guard();
