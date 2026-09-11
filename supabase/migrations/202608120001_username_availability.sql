-- CreditScope 011: bezpieczne, ograniczone sprawdzenie dostępności username.
-- Funkcja nie zwraca żadnych danych istniejącego użytkownika i nie omija RLS dla tabel.

create or replace function public.check_username_availability(p_username text)
returns table (normalized_username text, is_available boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(btrim(coalesce(p_username, '')));
begin
  if normalized !~ '^[a-z0-9_.-]{3,50}$' then
    return query select normalized, false;
    return;
  end if;

  return query
  select normalized, not exists (
    select 1
    from public.profiles
    where lower(username) = normalized
  );
end;
$$;

revoke all on function public.check_username_availability(text) from public;
grant execute on function public.check_username_availability(text) to anon, authenticated;
