-- Give the seeded projects an area unit + currency so inventory figures have
-- meaning (US in sqft/USD, the rest in sqm/USD). Only fills nulls.
update public.projects
set
  currency  = coalesce(currency, 'USD'),
  size_type = coalesce(
    size_type,
    case when country = 'United States' then 'sqft'::public.size_type
         else 'sqm'::public.size_type end
  )
where size_type is null or currency is null;

-- 50 units per existing project, with sizes, prices and statuses that vary by
-- both project and unit (hashtext seeds per-project variation). Guarded by
-- `where not exists` so re-running is a no-op.
with units as (
  select
    p.id           as project_id,
    p.project_name as project_name,
    g,
    abs(hashtext(p.id::text)) as seed
  from public.projects p
  cross join generate_series(1, 50) as g
)
insert into public.inventory
  (project_id, unit, unit_description, unit_size, price, status)
select
  u.project_id,
  'U-' || lpad(u.g::text, 3, '0'),
  u.project_name || ' — unit ' || u.g,
  (650 + ((u.seed + u.g * 23) % 850))::numeric,
  (95000 + ((u.seed + u.g * 4637) % 555000))::numeric(12, 2),
  (array[
     'available', 'available', 'available', 'under_contract', 'sold'
   ]::public.inventory_status[])[1 + ((u.seed + u.g) % 5)]
from units u
where not exists (select 1 from public.inventory);
