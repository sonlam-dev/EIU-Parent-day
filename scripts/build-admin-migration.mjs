import fs from 'node:fs';
const samples=JSON.parse(fs.readFileSync(new URL('../supabase/emergency-messages.json',import.meta.url),'utf8'));
if(samples.length!==120 || new Set(samples.map(s=>s[1])).size!==120) throw Error('Expected exactly 120 unique emergency messages');
const quote=s=>`'${s.replaceAll("'","''")}'`;
const seed=samples.map(([recipient,message],i)=>`(${i+1},${quote(recipient)},${quote(message)})`).join(',\n');
const sql=`-- Apply after migration 001. Re-runnable; does not delete wishes or create emergency wishes.
begin;
alter table public.wishes add column if not exists source text not null default 'guest'
  check (source in ('guest','emergency'));

create table if not exists public.emergency_samples (
  id integer primary key check (id between 1 and 120),
  recipient text not null check (char_length(recipient) between 1 and 60),
  message text not null check (char_length(message) between 10 and 500)
);
create table if not exists public.emergency_cursor (
  singleton boolean primary key default true check (singleton),
  next_index bigint not null default 0
);
create table if not exists public.admin_operations (
  request_id uuid primary key,
  actor uuid not null,
  action text not null check (action in ('emergency','delete_all')),
  result_count integer not null,
  created_at timestamptz not null default now()
);
alter table public.emergency_samples enable row level security;
alter table public.emergency_cursor enable row level security;
alter table public.admin_operations enable row level security;
revoke all on public.emergency_samples, public.emergency_cursor, public.admin_operations from public, anon, authenticated;

insert into public.emergency_cursor(singleton,next_index) values(true,0) on conflict do nothing;
insert into public.emergency_samples(id,recipient,message) values
${seed}
on conflict(id) do update set recipient=excluded.recipient,message=excluded.message;

create or replace function public.admin_emergency_wishes(p_request_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  batch_count integer;
  start_index bigint;
  batch_time timestamptz;
  previous public.admin_operations%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;
  if p_request_id is null then raise exception 'REQUEST_ID_REQUIRED'; end if;
  perform pg_advisory_xact_lock(23399,120);
  select * into previous from public.admin_operations where request_id=p_request_id;
  if found then
    if previous.actor<>auth.uid() or previous.action<>'emergency' then raise exception 'REQUEST_ID_CONFLICT'; end if;
    return previous.result_count;
  end if;
  if (select count(*) from public.emergency_samples)<>120 then raise exception 'SAMPLES_NOT_READY'; end if;
  select next_index into start_index from public.emergency_cursor where singleton=true for update;
  batch_count:=10;
  select greatest(clock_timestamp(),coalesce(max(created_at)+interval '1 millisecond',clock_timestamp()))
    into batch_time from public.wishes;
  insert into public.wishes(id,name,recipient,message,color,status,source,created_at)
  select gen_random_uuid(),(array['Mẹ Lan','Ba Hùng','Mẹ Mai','Ba Tuấn','Mẹ Thảo','Ba Dũng','Mẹ Hoa','Ba Nam','Mẹ Hương','Ba Minh'])[((start_index+i)%10)::integer+1],s.recipient,s.message,
    (array['green','gold','pink','sage'])[((start_index+i)%4)::integer+1],'approved','emergency',batch_time+i*interval '1 millisecond'
  from generate_series(0,batch_count-1) as i
  join public.emergency_samples s on s.id=((start_index+i)%120)::integer+1;
  update public.emergency_cursor set next_index=(start_index+batch_count)%120 where singleton=true;
  insert into public.admin_operations(request_id,actor,action,result_count)
  values(p_request_id,auth.uid(),'emergency',batch_count);
  return batch_count;
end;
$$;

create or replace function public.admin_delete_all_wishes(p_request_id uuid,p_confirmation text)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  deleted_count integer;
  previous public.admin_operations%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;
  if p_confirmation is distinct from 'DELETE_ALL_WISHES' then raise exception 'CONFIRMATION_REQUIRED'; end if;
  if p_request_id is null then raise exception 'REQUEST_ID_REQUIRED'; end if;
  perform pg_advisory_xact_lock(23399,120);
  select * into previous from public.admin_operations where request_id=p_request_id;
  if found then
    if previous.actor<>auth.uid() or previous.action<>'delete_all' then raise exception 'REQUEST_ID_CONFLICT'; end if;
    return previous.result_count;
  end if;
  -- DELETE emits Realtime events so display clients remove letters; TRUNCATE would not.
  delete from public.wishes where id is not null;
  get diagnostics deleted_count=row_count;
  update public.emergency_cursor set next_index=0 where singleton=true;
  insert into public.admin_operations(request_id,actor,action,result_count)
  values(p_request_id,auth.uid(),'delete_all',deleted_count);
  return deleted_count;
end;
$$;
revoke all on function public.admin_emergency_wishes(uuid) from public,anon,authenticated;
revoke all on function public.admin_delete_all_wishes(uuid,text) from public,anon,authenticated;
grant execute on function public.admin_emergency_wishes(uuid) to authenticated;
grant execute on function public.admin_delete_all_wishes(uuid,text) to authenticated;
commit;
`;
fs.writeFileSync(new URL('../supabase/migrations/003_admin_operations.sql',import.meta.url),sql);
fs.writeFileSync(new URL('../supabase/migrations/005_parent_to_child_samples.sql',import.meta.url),`-- Updates the 120 saved templates for future Emergency batches.
-- Does not change existing wishes, create letters, or reset the sample cursor.
-- Requires migration 003 first. Safe to run more than once.
begin;
insert into public.emergency_samples(id,recipient,message) values
${seed}
on conflict(id) do update set recipient=excluded.recipient,message=excluded.message;
commit;
`);
const deleteFunction=sql.match(/create or replace function public\.admin_delete_all_wishes[\s\S]*?\$\$;/)?.[0];
const emergencyFunction=sql.match(/create or replace function public\.admin_emergency_wishes[\s\S]*?\$\$;/)?.[0];
if(!emergencyFunction) throw Error('Emergency function missing');
fs.writeFileSync(new URL('../supabase/migrations/006_ten_colorful_parent_wishes.sql',import.meta.url),`-- Updates templates and future batches to exactly 10 letters in four colors.
-- Preserves existing wishes, sample cursor, permissions, and request retry history.
-- Requires migration 003 first. Safe to run more than once.
begin;
insert into public.emergency_samples(id,recipient,message) values
${seed}
on conflict(id) do update set recipient=excluded.recipient,message=excluded.message;
${emergencyFunction}
revoke all on function public.admin_emergency_wishes(uuid) from public,anon,authenticated;
grant execute on function public.admin_emergency_wishes(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
`);
if(!deleteFunction) throw Error('Delete function missing');
fs.writeFileSync(new URL('../supabase/migrations/004_fix_admin_delete.sql',import.meta.url),`-- Updates the function only; does not delete any data when this migration runs.
-- Explicit predicate supports projects with safeupdate enabled.
begin;
${deleteFunction}
revoke all on function public.admin_delete_all_wishes(uuid,text) from public,anon,authenticated;
grant execute on function public.admin_delete_all_wishes(uuid,text) to authenticated;
notify pgrst, 'reload schema';
commit;
`);
console.log('Generated migration 003 with 120 unique emergency messages.');
