-- Free-text notes attached to a lead. Any authenticated user can add a note;
-- notes are kept simple (no edit history, no author column for now).
-- Readable + insertable by all authenticated users; deletes by admins only.
create table public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  note       text not null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_id_idx on public.lead_notes (lead_id);

alter table public.lead_notes enable row level security;

-- Read: any authenticated user.
create policy "lead_notes_read_authenticated" on public.lead_notes
  for select to authenticated using (true);

-- Insert: any authenticated user (anyone can leave a note on a lead).
create policy "lead_notes_insert_authenticated" on public.lead_notes
  for insert to authenticated with check (true);

-- Delete: admins only.
create policy "lead_notes_delete_admin" on public.lead_notes
  for delete to authenticated using (public.is_admin());
