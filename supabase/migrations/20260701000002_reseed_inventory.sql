-- Rebuild inventory sample data now that unit_type / unit_floor exist.
-- Clears the table and re-seeds 50 units per project with the new columns
-- populated. Re-running is idempotent (delete + deterministic re-insert).
delete from public.inventory;

with base as (
  select
    p.id           as project_id,
    p.project_name as project_name,
    g,
    abs(hashtext(p.id::text)) as seed,
    (array[
       'apartment', 'apartment', 'house', 'deposit', 'parking'
     ]::public.unit_type[])[1 + ((abs(hashtext(p.id::text)) + g) % 5)] as unit_type
  from public.projects p
  cross join generate_series(1, 50) as g
)
insert into public.inventory
  (project_id, unit, unit_type, unit_floor, unit_description, unit_size, price, status)
select
  b.project_id,
  'U-' || lpad(b.g::text, 3, '0'),
  b.unit_type,
  -- Floors are text: parking uses 'E1'-'E3', deposits sit in 'B1', the rest are numbered.
  case b.unit_type
    when 'parking' then 'E' || (1 + (b.g % 3))
    when 'deposit' then 'B1'
    else (1 + (b.g % 20))::text
  end,
  b.project_name || ' — unit ' || b.g,
  (650 + ((b.seed + b.g * 23) % 850))::numeric,
  (95000 + ((b.seed + b.g * 4637) % 555000))::numeric(12, 2),
  (array[
     'available', 'available', 'available', 'under_contract', 'sold'
   ]::public.inventory_status[])[1 + ((b.seed + b.g) % 5)]
from base b;
