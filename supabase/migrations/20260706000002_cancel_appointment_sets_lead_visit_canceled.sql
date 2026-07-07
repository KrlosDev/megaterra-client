-- Extend the appointment→lead stage sync so that cancelling an appointment
-- moves its lead to the 'visit_canceled' stage. Reuses the existing trigger
-- (appointments_sync_lead_stage); we only replace the function body.
-- Note the deliberate spelling difference: the appointment status enum uses
-- 'cancelled' (double l) while the lead_stage enum uses 'visit_canceled'.
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
  elsif (new.status = 'cancelled' and old.status is distinct from 'cancelled') then
    -- The visit was cancelled.
    update public.leads
      set lead_stage = 'visit_canceled'
      where id = new.lead_id;
  end if;
  return new;
end;
$$;
