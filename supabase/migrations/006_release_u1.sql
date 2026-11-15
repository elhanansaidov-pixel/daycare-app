-- PENDING: run only after Elhanan approves ("מאשר הסרת חסימה U1"), then remove the U1 pilot gates.
-- U1 released to everyone: remove the admin-only pilot guard on children.supplies.
drop trigger if exists supplies_pilot_guard on public.children;
drop function if exists public.supplies_pilot_guard();
