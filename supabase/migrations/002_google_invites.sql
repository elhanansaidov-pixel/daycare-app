-- ============================================================
--  שלב 2: קישורי הזמנה להורים (כניסה עם Google)
--  להריץ פעם אחת ב-Supabase > SQL Editor
-- ============================================================

-- קוד הזמנה אישי לכל ילד
alter table public.children add column if not exists invite_code text;
update public.children set invite_code = substr(md5(gen_random_uuid()::text), 1, 12) where invite_code is null;
alter table public.children alter column invite_code set default substr(md5(gen_random_uuid()::text), 1, 12);
create unique index if not exists children_invite_code_idx on public.children (invite_code);

-- הורה שלחץ על קישור ההזמנה מצורף לילד (לפי המייל שאיתו נכנס)
create or replace function public.redeem_invite(code text)
returns table (child_id uuid, child_name text)
language plpgsql security definer set search_path = public as $$
declare
  c record;
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  nm text := coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', split_part(em, '@', 1));
begin
  if em = '' then return; end if;
  select id, name into c from children where invite_code = code and active;
  if not found then return; end if;
  if not exists (select 1 from guardians g where g.child_id = c.id and lower(g.email) = em) then
    insert into guardians (child_id, name, relation, phone, email) values (c.id, nm, 'הורה', '', em);
  end if;
  return query select c.id, c.name;
end $$;

-- יצירת קישור חדש (הקישור הקודם מפסיק לעבוד). רק למטפלת.
create or replace function public.rotate_invite(child uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare nc text := substr(md5(gen_random_uuid()::text), 1, 12);
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update children set invite_code = nc where id = child;
  return nc;
end $$;

revoke all on function public.redeem_invite(text) from public, anon;
revoke all on function public.rotate_invite(uuid) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.rotate_invite(uuid) to authenticated;
