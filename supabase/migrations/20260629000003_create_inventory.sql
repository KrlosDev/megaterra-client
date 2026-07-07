-- Unit of area a project's sizes are expressed in.
create type public.size_type as enum ('sqft', 'sqm');

-- Project-level attributes (nullable; existing rows predate them):
--   size_type — the area unit (sqft / sqm) its inventory sizes use.
--   currency  — ISO 4217 code (e.g. 'USD') its inventory prices are quoted in.
alter table public.projects
  add column size_type public.size_type,
  add column currency  text;

-- Sale status of an individual inventory unit.
create type public.inventory_status as enum ('sold', 'available', 'under_contract');

-- Individual sellable units belonging to a project.
-- unit_size is expressed in the parent project's size_type (sqft / sqm).
create table public.inventory (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  unit             text not null,
  unit_description text,
  unit_size        numeric,
  price            numeric(12, 2),
  status           public.inventory_status not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index inventory_project_id_idx on public.inventory (project_id);

-- Keep updated_at current on every row update (reuses public.set_updated_at()).
create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

alter table public.inventory enable row level security;

-- Read: any authenticated user (admin + executive) can read every unit.
create policy "inventory_read_authenticated" on public.inventory
  for select to authenticated using (true);

-- Insert: any authenticated user — admins and executives may both add units.
create policy "inventory_insert_authenticated" on public.inventory
  for insert to authenticated with check (true);

-- Update: any authenticated user — admins and executives may both edit.
create policy "inventory_update_authenticated" on public.inventory
  for update to authenticated using (true) with check (true);

-- Delete: admins only (executives may read and edit but not delete).
create policy "inventory_delete_admin" on public.inventory
  for delete to authenticated using (public.is_admin());
