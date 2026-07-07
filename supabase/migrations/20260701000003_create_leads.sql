-- Interest level of a lead.
create type public.lead_temperature as enum ('hot', 'warm', 'cold');

-- Pipeline stage of a lead. Values normalized to snake_case (the source spec
-- used spaces/slashes; the UI renders friendly labels).
create type public.lead_stage as enum (
  'broker_not_qualified',
  'not_qualified',
  'potential_client',
  'no_answer',
  'new_lead',
  'future_contact',
  'follow_up',
  'visit_scheduled',
  'visit_completed',
  'visit_canceled',
  'under_contract_negotiation'
);

-- Sales leads. Budget is a range (budget_min..budget_max) expressed in the
-- currency of the linked project. Readable by all authenticated users; inserts
-- and edits by all authenticated users; deletes by admins only.
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  lead_name       text not null,
  lead_email      text,
  lead_phone      text,
  lead_source     text,
  ad_name         text,
  form_name       text,
  created_date    timestamptz not null default now(),
  target_interest text,
  budget_min      numeric,
  budget_max      numeric,
  temperature     public.lead_temperature,
  last_contacted  timestamptz,
  lead_stage      public.lead_stage not null default 'new_lead',
  advisor_id      uuid references public.profiles (id) on delete set null,
  project_id      uuid references public.projects (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index leads_project_id_idx on public.leads (project_id);
create index leads_advisor_id_idx on public.leads (advisor_id);
create index leads_stage_idx      on public.leads (lead_stage);

-- Keep updated_at current on every row update (reuses public.set_updated_at()).
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

-- Read: any authenticated user (admin + executive).
create policy "leads_read_authenticated" on public.leads
  for select to authenticated using (true);

-- Insert: any authenticated user (advisors create their own leads).
create policy "leads_insert_authenticated" on public.leads
  for insert to authenticated with check (true);

-- Update: any authenticated user.
create policy "leads_update_authenticated" on public.leads
  for update to authenticated using (true) with check (true);

-- Delete: admins only.
create policy "leads_delete_admin" on public.leads
  for delete to authenticated using (public.is_admin());
