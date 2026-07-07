-- Returns true if the current user's profile is mapped to the 'admin' role.
-- SECURITY DEFINER so it can read profiles from inside RLS policies on
-- profiles itself without triggering infinite recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.auth_id = auth.uid()
      and r.name = 'admin'
  );
$$;

alter table public.roles    enable row level security;
alter table public.profiles enable row level security;

-- Read: any authenticated user (admin + executive) can read every row.
create policy "roles_read_authenticated" on public.roles
  for select to authenticated using (true);
create policy "profiles_read_authenticated" on public.profiles
  for select to authenticated using (true);

-- Write: admins only (insert / update / delete) on every row.
create policy "roles_write_admin" on public.roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_write_admin" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
