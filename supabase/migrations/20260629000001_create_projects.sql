-- Lifecycle status of a real estate project.
create type public.project_status as enum ('pre_sale', 'in_construction', 'move_in_ready');

-- Real estate projects. Readable by all authenticated users, writable by admins.
-- country holds the human-readable country name (e.g. 'Panama'), chosen on the
-- client from a country-name list and stored as-is.
create table public.projects (
  id                    uuid primary key default gen_random_uuid(),
  project_name          text not null,
  project_description   text,
  project_status        public.project_status not null,
  address               text,
  inventory_description text,
  country               text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Keep updated_at current on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Read: any authenticated user (admin + executive) can read every project.
create policy "projects_read_authenticated" on public.projects
  for select to authenticated using (true);

-- Write: admins only (insert / update / delete). Reuses public.is_admin().
create policy "projects_write_admin" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
