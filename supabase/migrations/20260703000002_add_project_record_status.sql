-- Lifecycle/visibility of a project record, independent of its sales
-- project_status. Lets us soft-delete (and later archive) projects instead of
-- removing the row, so linked leads/inventory/appointments are preserved.
create type public.project_record_status as enum ('active', 'archived', 'deleted');

alter table public.projects
  add column record_status public.project_record_status not null default 'active';

create index projects_record_status_idx on public.projects (record_status);
