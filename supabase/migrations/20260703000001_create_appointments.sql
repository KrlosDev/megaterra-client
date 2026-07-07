-- Meeting channel for an appointment.
create type public.appointment_type as enum ('in_person', 'call', 'zoom');

-- Lifecycle status of an appointment. Default on creation is
-- 'pending_confirmation'; 'rescheduled' is set when the time is moved.
create type public.appointment_status as enum (
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'showed_up',
  'no_show',
  'rescheduled'
);

-- Appointments: a scheduled time when a lead visits a project (or meets via
-- call / Zoom). advisor_id is the profile that created the appointment.
-- original_scheduled_at holds the prior time and is only set on a reschedule.
-- Readable/insertable/updatable by all authenticated users; deletes by admins.
create table public.appointments (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects (id) on delete cascade,
  lead_id               uuid not null references public.leads (id) on delete cascade,
  advisor_id            uuid references public.profiles (id) on delete set null,
  status                public.appointment_status not null default 'pending_confirmation',
  appointment_type      public.appointment_type not null default 'in_person',
  scheduled_at          timestamptz not null,
  original_scheduled_at timestamptz,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index appointments_project_id_idx   on public.appointments (project_id);
create index appointments_lead_id_idx      on public.appointments (lead_id);
create index appointments_advisor_id_idx   on public.appointments (advisor_id);
create index appointments_scheduled_at_idx on public.appointments (scheduled_at);
create index appointments_status_idx       on public.appointments (status);

-- Keep updated_at current on every row update (reuses public.set_updated_at()).
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

-- Read: any authenticated user (admin + executive).
create policy "appointments_read_authenticated" on public.appointments
  for select to authenticated using (true);

-- Insert: any authenticated user (advisors create their own appointments).
create policy "appointments_insert_authenticated" on public.appointments
  for insert to authenticated with check (true);

-- Update: any authenticated user.
create policy "appointments_update_authenticated" on public.appointments
  for update to authenticated using (true) with check (true);

-- Delete: admins only.
create policy "appointments_delete_admin" on public.appointments
  for delete to authenticated using (public.is_admin());
