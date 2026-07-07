-- Sample projects spanning all three statuses and several Panamerican countries.
-- Guarded by `where not exists` so re-running is a no-op (no natural unique key).
insert into public.projects
  (project_name, project_description, project_status, address, inventory_description, country)
select * from (values
  ('Bahía Pre-venta',
   'Beachfront pre-sale condos with early-buyer pricing.',
   'pre_sale'::public.project_status,
   'Av. Balboa, Panama City', '120 units, 1-3 bedrooms', 'Panama'),
  ('Torre Construcción',
   'High-rise residential tower currently under construction.',
   'in_construction'::public.project_status,
   'Carrera 7, Bogotá', '200 units across 30 floors', 'Colombia'),
  ('Residencias Listas',
   'Completed gated community, ready for immediate move-in.',
   'move_in_ready'::public.project_status,
   '500 Brickell Ave, Miami', '45 single-family homes', 'United States'),
  ('Costa Pre-venta',
   'Pacific-coast pre-sale development with ocean views.',
   'pre_sale'::public.project_status,
   'Av. Camarón, Puerto Vallarta', '80 units, studios to 2-bed', 'Mexico'),
  ('Valle Construcción',
   'Mountain-valle mid-rise under active construction.',
   'in_construction'::public.project_status,
   'San José Centro', '60 apartments, 2-3 bedrooms', 'Costa Rica')
) as v
where not exists (select 1 from public.projects);
