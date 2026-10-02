-- Migration du 28/09/2026 : plus de choix de gâteau (il se fera sur place).
-- À coller tel quel dans l'éditeur SQL Supabase, sur une base créée avec
-- supabase/menus.sql du 24/09. Idempotent : peut être rejoué sans risque.
-- 1) confirm_menu sans quota ni colonne cake ; 2) suppression du comptage et
-- de la colonne. Ordre important : la fonction d'abord, la colonne ensuite.

create or replace function public.confirm_menu(p_token text, p_choices jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $confirm$
declare
  h public.menu_households%rowtype;
begin
  select * into h from public.menu_households where token = p_token for update;
  if not found then
    raise exception 'not-found';
  end if;
  if h.confirmed_at is not null then
    raise exception 'already-confirmed';
  end if;
  if jsonb_typeof(p_choices) <> 'array'
     or jsonb_array_length(p_choices) <> h.adults + h.children
     or (select count(*) from jsonb_array_elements(p_choices) c where c->>'kind' = 'adult') <> h.adults then
    raise exception 'bad-count';
  end if;

  delete from public.menu_choices where household_id = h.id;

  insert into public.menu_choices (household_id, position, person_name, kind, starter, main, cheese)
  select h.id,
         (c.ord - 1)::int,
         left(trim(c.val->>'person_name'), 60),
         c.val->>'kind',
         nullif(c.val->>'starter', ''),
         c.val->>'main',
         coalesce((c.val->>'cheese')::boolean, false)
    from jsonb_array_elements(p_choices) with ordinality as c(val, ord);

  update public.menu_households set confirmed_at = now() where id = h.id;
end $confirm$;

-- Only the server (service_role) may call it.
revoke all on function public.confirm_menu(text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_menu(text, jsonb) to service_role;

drop function if exists public.menu_cake_counts();
alter table public.menu_choices drop column if exists cake;
