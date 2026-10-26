-- 1. Create the organizer's account in Supabase Authentication > Users first.
-- 2. Replace the email below with that account's real email.
-- 3. Run in the Supabase SQL Editor as the project owner.
do $$
declare
  admin_email text := 'son.lam@eiu.edu.vn';
  admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email) = lower(admin_email);
  if admin_id is null then
    raise exception 'Account not found. Create the user in Authentication > Users and replace the email in this script.';
  end if;
  insert into public.admins(user_id) values (admin_id) on conflict (user_id) do nothing;
end;
$$;
