-- Roles available in the app. Currently: admin, executive.
create table public.roles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- Seed the two known roles.
insert into public.roles (name) values ('admin'), ('executive')
on conflict (name) do nothing;
