-- Updates the function only; does not delete any data when this migration runs.
-- Explicit predicate supports projects with safeupdate enabled.
begin;
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
revoke all on function public.admin_delete_all_wishes(uuid,text) from public,anon,authenticated;
grant execute on function public.admin_delete_all_wishes(uuid,text) to authenticated;
notify pgrst, 'reload schema';
commit;
