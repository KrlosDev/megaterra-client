-- Keep a lead's pipeline stage in sync with its appointments:
--   * scheduling an appointment moves the lead to 'visit_scheduled'
--   * an appointment transitioning to 'showed_up' moves it to 'visit_completed'
-- Centralised in a trigger so the rule holds no matter how the appointment is
-- created/updated (create sheet, status change, future integrations, imports).
-- SECURITY DEFINER so the leads update is never blocked by the acting user's RLS.
create or replace function public.sync_lead_stage_from_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    -- A newly scheduled appointment moves the lead into the visit pipeline
    -- (already-'showed_up' inserts jump straight to completed).
    update public.leads
      set lead_stage = (case
        when new.status = 'showed_up' then 'visit_completed'
        else 'visit_scheduled'
      end)::public.lead_stage
      where id = new.lead_id;
  elsif (new.status = 'showed_up' and old.status is distinct from 'showed_up') then
    -- The lead showed up to the visit.
    update public.leads
      set lead_stage = 'visit_completed'
      where id = new.lead_id;
  end if;
  return new;
end;
$$;

create trigger appointments_sync_lead_stage
  after insert or update of status on public.appointments
  for each row execute function public.sync_lead_stage_from_appointment();
