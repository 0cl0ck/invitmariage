-- ===========================================================================
-- 7) Choix des menus (repas du 10 octobre 2026)
-- À exécuter dans Supabase > SQL Editor, APRÈS schema.sql. Idempotent.
--
-- menu_households : un foyer = un lien personnel (/menu/<token>), créé par les
--   mariés depuis /espace-maries/menus à partir des réponses RSVP « oui ».
-- menu_choices    : une ligne par personne du foyer.
-- confirm_menu()  : enregistre et verrouille les choix d'un foyer, en une seule
--   transaction.
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
-- choices = [{ "person_name", "kind", "starter", "main", "cheese" }, ...]
-- Erreurs levées (message) : not-found, already-confirmed, bad-count.
-- Les contraintes CHECK rejettent tout choix invalide.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7b) Correctif (24/09) : un seul lien par réponse RSVP, même si les deux
-- mariés cliquent « Créer les liens manquants » en même temps.
-- ---------------------------------------------------------------------------
create unique index if not exists menu_households_rsvp_uniq
  on public.menu_households (rsvp_id)
  where rsvp_id is not null;

-- ---------------------------------------------------------------------------
-- 8) Migration (28/09) : plus de choix de gâteau, il se fera sur place.
-- À coller dans l'éditeur SQL Supabase (idempotent) si la base a été créée
-- avec la version du 24/09. Supprime la colonne, la fonction de comptage et
-- réinstalle confirm_menu (définition ci-dessus, sans quota).
-- ---------------------------------------------------------------------------
drop function if exists public.menu_cake_counts();
alter table public.menu_choices drop column if exists cake;

-- ---------------------------------------------------------------------------
-- 9) Migrations du 04/10, à exécuter après ce fichier sur une base neuve :
--    supabase/2026-10-04-invites-derniere-minute.sql (ask_rsvp + answer_invite)
--    supabase/2026-10-04-entree-facultative-allergies.sql (entrée facultative,
--    allergie par personne, confirm_menu qui la recopie)
-- ---------------------------------------------------------------------------
