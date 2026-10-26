-- Read-only checks after running migrations/001_wish_tree.sql.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wishes';

select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('wishes', 'admins', 'rate_windows');

select status, count(*) from public.wishes group by status;

select user_id from public.admins;
