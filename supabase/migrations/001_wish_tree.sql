-- Run ONCE in a new Supabase project's SQL Editor.
begin;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
create policy "Admins see own membership" on public.admins for select to authenticated using (user_id = auth.uid());

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.wishes (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  recipient text not null check (char_length(btrim(recipient)) between 1 and 60),
  message text not null check (char_length(btrim(message)) between 10 and 500),
  color text not null check (color in ('green','gold','pink','sage')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index wishes_status_created on public.wishes(status, created_at desc);
alter table public.wishes enable row level security;
revoke all on public.wishes from anon, authenticated;
grant select on public.wishes to anon, authenticated;
grant update (status) on public.wishes to authenticated;
grant all on public.wishes to service_role;
create policy "Approved wishes or admin" on public.wishes for select to anon, authenticated
using (status = 'approved' or (select public.is_admin()));
create policy "Admins moderate" on public.wishes for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Private counters; clients cannot read or modify these.
create table public.rate_windows (
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key(bucket, window_start)
);
alter table public.rate_windows enable row level security;
revoke all on public.rate_windows from public, anon, authenticated;

create function public.submit_wish(p_id uuid, p_name text, p_recipient text, p_message text, p_color text, p_ip_hash text, p_device_hash text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  window_time timestamptz := to_timestamp(floor(extract(epoch from now()) / 600) * 600);
  counter integer;
  existing_status text;
begin
  -- Serialize retries of the same request ID, avoiding duplicate leaves/counts.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select status into existing_status from public.wishes where id = p_id;
  if found then return jsonb_build_object('id',p_id,'status',existing_status); end if;
  insert into public.rate_windows(bucket,window_start) values ('ip:' || p_ip_hash,window_time)
  on conflict (bucket,window_start) do update set count = public.rate_windows.count + 1 returning count into counter;
  if counter > 300 then raise exception 'RATE_LIMIT'; end if;
  insert into public.rate_windows(bucket,window_start) values ('device:' || p_device_hash,window_time)
  on conflict (bucket,window_start) do update set count = public.rate_windows.count + 1 returning count into counter;
  if counter > 5 then raise exception 'RATE_LIMIT'; end if;
  insert into public.wishes(id,name,recipient,message,color) values(p_id,p_name,p_recipient,p_message,p_color);
  delete from public.rate_windows where window_start < now() - interval '1 day';
  return jsonb_build_object('id',p_id,'status','pending');
end;
$$;
revoke all on function public.submit_wish(uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_wish(uuid,text,text,text,text,text,text) to service_role;

alter publication supabase_realtime add table public.wishes;
commit;
