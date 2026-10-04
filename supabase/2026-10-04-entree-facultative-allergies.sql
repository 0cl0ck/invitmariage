-- Migration du 04/10/2026 (2/2) : entrée facultative + allergie par personne.
-- À coller dans l'éditeur SQL Supabase APRÈS 2026-10-04-invites-derniere-minute.sql,
-- et AVANT de déployer le code. Idempotent : peut être rejoué sans risque.
--
-- 1) Un adulte peut ne pas prendre d'entrée (starter null = « Sans entrée »).
-- 2) menu_choices.allergy : allergie / régime d'une personne, corrigé par les
--    mariés dans /espace-maries/restaurant (le texte libre du RSVP reste intact).
-- 3) confirm_menu() recopie l'allergie : « Changer les menus » ne l'efface pas.

-- 1) La contrainte « adulte = entrée obligatoire » porte un nom généré par
--    Postgres : on la retrouve par sa définition.
do $$
declare
  c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.menu_choices'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%starter IS NOT NULL%'
  loop
    execute format('alter table public.menu_choices drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.menu_choices drop constraint if exists menu_choices_dishes_check;
alter table public.menu_choices add constraint menu_choices_dishes_check check (
  (kind = 'adult' and main in ('carrelet', 'agneau', 'burrata'))
  or (kind = 'child' and starter is null and main in ('poulet', 'poisson'))
);

-- 2) Allergie par personne.
alter table public.menu_choices
  add column if not exists allergy text check (char_length(allergy) <= 120);

-- 3) confirm_menu : même définition, plus la colonne allergy.
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
         c.val->>'main',
         coalesce((c.val->>'cheese')::boolean, false),
         nullif(left(trim(coalesce(c.val->>'allergy', '')), 120), '')
    from jsonb_array_elements(p_choices) with ordinality as c(val, ord);

  update public.menu_households set confirmed_at = now() where id = h.id;
end $confirm$;

-- Only the server (service_role) may call it.
revoke all on function public.confirm_menu(text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_menu(text, jsonb) to service_role;

-- PostgREST (l'API Supabase) voit tout de suite la nouvelle colonne.
notify pgrst, 'reload schema';
