-- Auto-create a profile row whenever an auth user is created.
-- Console-created users only carry id + email; richer fields (display_name,
-- phone_number, id_number, id_type, role_id) are filled in later by admins.
-- SECURITY DEFINER so the insert bypasses RLS on public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_id, email)
  values (new.id, new.email)
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
