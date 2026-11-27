-- Called by .github/workflows/supabase-keepalive.yml so the Free plan never sees 7 idle days.
create function public.keepalive() returns int
language sql stable security invoker set search_path = ''
as $$ select 1 $$;

revoke execute on function public.keepalive() from public;
grant execute on function public.keepalive() to anon;
