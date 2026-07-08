-- Per-user UI language preference (null = not chosen; the client falls back to
-- the browser/localStorage detector, then English). Constrained to supported
-- language codes.
alter table public.profiles
  add column preferred_language text
    check (preferred_language in ('en', 'es'));

-- Let any authenticated user set THEIR OWN language without opening up the
-- admin-only profiles write policy. SECURITY DEFINER runs as the function owner
-- and only ever touches the caller's row + the single preferred_language column,
-- so role_id/email etc. stay protected (mirrors public.is_admin()).
create or replace function public.set_my_preferred_language(lang text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if lang is null or lang not in ('en', 'es') then
    raise exception 'unsupported language: %', lang;
  end if;
  update public.profiles
    set preferred_language = lang
    where auth_id = auth.uid();
end;
$$;

grant execute on function public.set_my_preferred_language(text) to authenticated;
