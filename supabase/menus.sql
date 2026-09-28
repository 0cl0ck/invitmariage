-- ===========================================================================
-- 7) Choix des menus (repas du 10 octobre 2026)
-- À exécuter dans Supabase > SQL Editor, APRÈS schema.sql. Idempotent.
--
-- menu_households : un foyer = un lien personnel (/menu/<token>), créé par les
--   mariés depuis /espace-maries/menus à partir des réponses RSVP « oui ».
-- menu_choices    : une ligne par personne du foyer.
-- confirm_menu()  : enregistre et verrouille les choix d'un foyer, en une seule
--   transaction, avec le quota de 20 parts par parfum de gâteau.
--
-- Les invités n'ont AUCUN accès direct à ces tables : ils passent par les
-- fonctions serveur Vercel (/api/menu), qui utilisent la clé service_role.
-- ===========================================================================

create table if not exists public.menu_households (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  -- 32 hex chars (122 random bits): the guest's personal link
  token          text not null unique
                   default replace(gen_random_uuid()::text, '-', ''),
  rsvp_id        uuid references public.rsvp_responses (id) on delete set null,
  name           text not null check (char_length(name) between 1 and 80),
  email          text check (email is null or char_length(email) between 3 and 120),
  lang           text not null default 'fr' check (lang in ('fr', 'es')),
  adults         int  not null default 1 check (adults between 0 and 20),
  children       int  not null default 0 check (children between 0 and 12),
  request_sent_at      timestamptz,
  confirmed_at         timestamptz,
  confirmation_sent_at timestamptz
);

create index if not exists menu_households_rsvp_idx
  on public.menu_households (rsvp_id);

create table if not exists public.menu_choices (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  household_id uuid not null references public.menu_households (id) on delete cascade,
  position     int  not null check (position between 0 and 40),
  person_name  text not null check (char_length(person_name) between 1 and 60),
  kind         text not null check (kind in ('adult', 'child')),
  starter      text check (starter in ('veau', 'gaspacho')),
  main         text not null check (main in ('carrelet', 'agneau', 'burrata', 'poulet', 'poisson')),
  cheese       boolean not null default false,
  cake         text not null check (cake in ('chocolat', 'fruits_rouges', 'exotique')),
  unique (household_id, position),
  -- adults: starter + adult main; children: kids' menu, no starter
  check (
    (kind = 'adult' and starter is not null and main in ('carrelet', 'agneau', 'burrata'))
    or (kind = 'child' and starter is null and main in ('poulet', 'poisson'))
  )
);

create index if not exists menu_choices_household_idx
  on public.menu_choices (household_id);

-- RLS : mariés connectés uniquement (lecture, ajout, modification, suppression).
-- Aucune policy pour anon => les invités ne lisent ni n'écrivent rien en direct.
alter table public.menu_households enable row level security;
alter table public.menu_choices    enable row level security;

drop policy if exists "menu households auth" on public.menu_households;
create policy "menu households auth"
  on public.menu_households
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "menu choices auth" on public.menu_choices;
create policy "menu choices auth"
  on public.menu_choices
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- confirm_menu(token, choices) : appelée par /api/menu (service_role).
-- choices = [{ "person_name", "kind", "starter", "main", "cheese", "cake" }, ...]
-- Erreurs levées (message) : not-found, already-confirmed, bad-count,
-- cake-full:<parfum>. Les contraintes CHECK rejettent tout choix invalide.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_menu(p_token text, p_choices jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $confirm$
declare
  h        public.menu_households%rowtype;
  cake_cap constant int := 20;
  flavor   text;
  taken    int;
  wanted   int;
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

  -- Serialize every confirmation so two households cannot take the last part.
  perform pg_advisory_xact_lock(hashtext('menu_cakes'));

  foreach flavor in array array['chocolat', 'fruits_rouges', 'exotique'] loop
    select count(*) into taken
      from public.menu_choices mc
      join public.menu_households mh on mh.id = mc.household_id
     where mc.cake = flavor and mh.confirmed_at is not null;
    select count(*) into wanted
      from jsonb_array_elements(p_choices) c
     where c->>'cake' = flavor;
    if taken + wanted > cake_cap then
      raise exception 'cake-full:%', flavor;
    end if;
  end loop;

  delete from public.menu_choices where household_id = h.id;

  insert into public.menu_choices (household_id, position, person_name, kind, starter, main, cheese, cake)
  select h.id,
         (c.ord - 1)::int,
         left(trim(c.val->>'person_name'), 60),
         c.val->>'kind',
         nullif(c.val->>'starter', ''),
         c.val->>'main',
         coalesce((c.val->>'cheese')::boolean, false),
         c.val->>'cake'
    from jsonb_array_elements(p_choices) with ordinality as c(val, ord);

  update public.menu_households set confirmed_at = now() where id = h.id;
end $confirm$;

-- Only the server (service_role) may call it.
revoke all on function public.confirm_menu(text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_menu(text, jsonb) to service_role;

-- Parts de gâteau déjà réservées (confirmées), pour afficher « complet ».
create or replace function public.menu_cake_counts()
returns table (cake text, taken int)
language sql
security definer
set search_path = public
as $counts$
  select mc.cake, count(*)::int
    from public.menu_choices mc
    join public.menu_households mh on mh.id = mc.household_id
   where mh.confirmed_at is not null
   group by mc.cake;
$counts$;

revoke all on function public.menu_cake_counts() from public, anon;
grant execute on function public.menu_cake_counts() to service_role, authenticated;

-- ---------------------------------------------------------------------------
-- 7b) Correctif (24/09) : un seul lien par réponse RSVP, même si les deux
-- mariés cliquent « Créer les liens manquants » en même temps.
-- ---------------------------------------------------------------------------
create unique index if not exists menu_households_rsvp_uniq
  on public.menu_households (rsvp_id)
  where rsvp_id is not null;
