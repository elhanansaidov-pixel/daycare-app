-- Applied to the live DB on 16/11/2026 after approval.
-- U1 released to everyone: remove the admin-only pilot guard on children.supplies.
drop trigger if exists supplies_pilot_guard on public.children;
drop function if exists public.supplies_pilot_guard();
