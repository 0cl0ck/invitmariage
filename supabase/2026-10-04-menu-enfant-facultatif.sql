-- Migration du 04/10/2026 (3) : menu enfant facultatif (tout-petits).
-- À coller dans l'éditeur SQL Supabase APRÈS 2026-10-04-invites-derniere-minute.sql
-- et 2026-10-04-entree-facultative-allergies.sql, AVANT de déployer le code.
-- Idempotent : peut être rejoué sans risque.
--
-- Un enfant peut n'avoir aucun menu (main null) ; un adulte garde un plat
-- obligatoire. confirm_menu enregistre null quand le plat est vide.

alter table public.menu_choices alter column main drop not null;

-- « main is not null » explicite : sans lui, un plat null passerait la
-- contrainte (une CHECK évaluée à NULL est acceptée).
alter table public.menu_choices drop constraint if exists menu_choices_dishes_check;
alter table public.menu_choices add constraint menu_choices_dishes_check check (
  (kind = 'adult' and main is not null and main in ('carrelet', 'agneau', 'burrata'))
  or (kind = 'child' and starter is null and (main is null or main in ('poulet', 'poisson')))
);

-- confirm_menu : même définition que la migration (2), plat vide = null.
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

  insert into public.menu_choices (household_id, position, person_name, kind, starter, main, cheese, allergy)
  select h.id,
         (c.ord - 1)::int,
         left(trim(c.val->>'person_name'), 60),
         c.val->>'kind',
         nullif(c.val->>'starter', ''),
         nullif(c.val->>'main', ''),
         coalesce((c.val->>'cheese')::boolean, false),
         nullif(left(trim(coalesce(c.val->>'allergy', '')), 120), '')
    from jsonb_array_elements(p_choices) with ordinality as c(val, ord);

  update public.menu_households set confirmed_at = now() where id = h.id;
end $confirm$;

-- Only the server (service_role) may call it.
revoke all on function public.confirm_menu(text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_menu(text, jsonb) to service_role;

-- PostgREST (l'API Supabase) voit tout de suite le changement.
notify pgrst, 'reload schema';
