-- Category of an inventory unit.
create type public.unit_type as enum ('apartment', 'house', 'deposit', 'parking');

-- Add unit type + floor to inventory (nullable; existing rows predate them).
-- unit_floor is text: floors can carry identifiers (e.g. parking floors 'E1', 'E2').
alter table public.inventory
  add column unit_type  public.unit_type,
  add column unit_floor text;
