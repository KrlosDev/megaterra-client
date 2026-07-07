-- Seed 8 leads per existing project, spread across stages/temperatures/sources.
-- advisor_id links to a random existing profile if any exist, else null (a fresh
-- DB has no profiles until users sign up). Guarded so re-running is a no-op.
with base as (
  select
    p.id           as project_id,
    p.project_name as project_name,
    g,
    abs(hashtext(p.id::text || '-' || g::text)) as seed
  from public.projects p
  cross join generate_series(1, 8) as g
)
insert into public.leads
  (lead_name, lead_email, lead_phone, lead_source, ad_name, form_name,
   created_date, target_interest, budget_min, budget_max, temperature,
   last_contacted, lead_stage, advisor_id, project_id)
select
  'Lead ' || b.g || ' — ' || b.project_name,
  'lead' || b.g || '.' || left(md5(b.project_id::text), 6) || '@example.com',
  '+50' || (7000000 + (b.seed % 2999999))::text,
  (array['facebook', 'instagram', 'google', 'referral', 'walk_in'])[1 + (b.seed % 5)],
  (array['Summer Campaign', 'Beachfront Promo', 'Year-End Deal', 'Investor Series'])[1 + (b.seed % 4)],
  (array['Landing Form A', 'Landing Form B', 'Contact Form'])[1 + (b.seed % 3)],
  now() - ((b.seed % 90) || ' days')::interval,
  (array['1-bedroom', '2-bedroom', '3-bedroom', 'penthouse', 'parking'])[1 + (b.seed % 5)],
  (80000 + (b.seed % 60000))::numeric,
  (160000 + (b.seed % 240000))::numeric,
  (array['hot', 'warm', 'cold']::public.lead_temperature[])[1 + (b.seed % 3)],
  now() - ((b.seed % 30) || ' days')::interval,
  (array[
     'new_lead', 'no_answer', 'follow_up', 'potential_client',
     'visit_scheduled', 'visit_completed', 'future_contact', 'not_qualified'
   ]::public.lead_stage[])[1 + (b.seed % 8)],
  (select id from public.profiles order by random() limit 1),
  b.project_id
from base b
where not exists (select 1 from public.leads);
