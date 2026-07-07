-- Identity document type for a profile.
create type public.id_type as enum ('national_id', 'passport');

-- One profile per auth user, holding app-level user info and their role.
create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_id      uuid not null unique references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  phone_number text,
  id_number    text,
  id_type      public.id_type,
  role_id      uuid references public.roles (id) on delete restrict,
  created_at   timestamptz not null default now()
);

create index profiles_role_id_idx on public.profiles (role_id);
