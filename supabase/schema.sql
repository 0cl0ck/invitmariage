-- ===========================================================================
-- Schéma Supabase — Tableau de covoiturage (et base prête pour le RSVP)
-- À exécuter dans Supabase > SQL Editor.
-- ===========================================================================

-- 1) Table des annonces de covoiturage
create table if not exists public.carpool_entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        text not null check (type in ('offer', 'seek')),
  name        text not null check (char_length(name) between 1 and 60),
  area        text not null check (char_length(area) between 1 and 80),
  seats       int  check (seats between 1 and 8),
  contact     text not null check (char_length(contact) between 1 and 120),
  note        text check (char_length(note) <= 200),
  variant     text
);

create index if not exists carpool_entries_created_idx
  on public.carpool_entries (created_at);

-- 2) Row Level Security : lecture + insertion publiques, pas de modif/suppression.
alter table public.carpool_entries enable row level security;

-- Lecture par tout le monde (site privé, lien partagé aux invités).
drop policy if exists "carpool read" on public.carpool_entries;
create policy "carpool read"
  on public.carpool_entries
  for select
  using (true);

-- Insertion par tout le monde (anon). 'offer' => seats obligatoire.
drop policy if exists "carpool insert" on public.carpool_entries;
create policy "carpool insert"
  on public.carpool_entries
  for insert
  with check (
    (type = 'seek' and seats is null)
    or (type = 'offer' and seats is not null)
  );

-- Suppression autorisée (un invité peut retirer une annonce postée par erreur).
-- NB: site privé (lien partagé aux invités) ; l'UI ne propose la suppression que
-- sur les annonces créées depuis l'appareil courant. Les mariés peuvent aussi
-- supprimer depuis le dashboard Supabase (Table editor).
drop policy if exists "carpool delete" on public.carpool_entries;
create policy "carpool delete"
  on public.carpool_entries
  for delete
  using (true);

-- Pas de policy UPDATE => pas de modification en place via le site.

-- 3) Realtime : le tableau se met à jour en direct (idempotent : ne replante pas
--    si la table est déjà membre de la publication).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'carpool_entries'
  ) then
    alter publication supabase_realtime add table public.carpool_entries;
  end if;
end $$;

-- ===========================================================================
-- 4) RSVP — réponses des invités
-- Insertion publique (chaque envoi = une ligne ; une correction = une nouvelle
-- ligne, le dashboard garde la plus récente par email). Lecture RÉSERVÉE aux
-- mariés connectés (Supabase Auth) : les invités ne peuvent pas lire les réponses.
-- ===========================================================================
create table if not exists public.rsvp_responses (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  variant    text,
  name       text not null check (char_length(name) between 1 and 80),
  -- email facultatif : les mariés peuvent saisir à la main un invité sans email
  email      text check (email is null or char_length(email) between 3 and 120),
  attending  text not null check (attending in ('yes', 'no')),
  guests     int  check (guests between 0 and 20),
  children   int  check (children between 0 and 12),
  dietary    text check (char_length(dietary) <= 200),
  message    text check (char_length(message) <= 500),
  -- 'guest' = formulaire du site, 'manual' = ajouté depuis /espace-maries
  source     text not null default 'guest' check (source in ('guest', 'manual'))
);

create index if not exists rsvp_email_idx on public.rsvp_responses (email);
create index if not exists rsvp_created_idx on public.rsvp_responses (created_at);

alter table public.rsvp_responses enable row level security;

-- Les invités (anon) peuvent envoyer / corriger une réponse.
drop policy if exists "rsvp insert" on public.rsvp_responses;
create policy "rsvp insert"
  on public.rsvp_responses
  for insert
  with check (true);

-- Lecture réservée aux utilisateurs connectés (les mariés via /espace-maries).
drop policy if exists "rsvp read auth" on public.rsvp_responses;
create policy "rsvp read auth"
  on public.rsvp_responses
  for select
  using (auth.role() = 'authenticated');

-- Suppression réservée aux mariés connectés (bouton « Nettoyer les doublons » et
-- suppression d'une réponse depuis /espace-maries). Les invités (anon) ne peuvent
-- pas supprimer.
drop policy if exists "rsvp delete auth" on public.rsvp_responses;
create policy "rsvp delete auth"
  on public.rsvp_responses
  for delete
  using (auth.role() = 'authenticated');

-- Pas de policy UPDATE : aucune modification en place via le site.

-- ---------------------------------------------------------------------------
-- Compte mariés pour le dashboard :
-- Supabase > Authentication > Users > "Add user" (email + mot de passe).
-- Ce compte sert à se connecter sur /espace-maries.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 5) Réponses saisies à la main par les mariés (invités sans internet)
-- Migration idempotente pour une base créée AVANT cette version : email
-- facultatif + colonne `source`. Sans effet sur une base fraîchement créée.
-- Les mariés connectés utilisent la policy "rsvp insert" existante.
-- ===========================================================================
alter table public.rsvp_responses alter column email drop not null;
alter table public.rsvp_responses drop constraint if exists rsvp_responses_email_check;
alter table public.rsvp_responses
  add constraint rsvp_responses_email_check
  check (email is null or char_length(email) between 3 and 120);
alter table public.rsvp_responses
  add column if not exists source text not null default 'guest'
  check (source in ('guest', 'manual'));

-- ===========================================================================
-- 6) Checklist de mariage des mariés (page /espace-maries/checklist)
-- Réservée aux mariés connectés : lecture, ajout, modification, suppression.
-- Partagée entre les deux (temps réel). Les invités (anon) n'y ont pas accès.
-- ===========================================================================
create table if not exists public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  title       text not null check (char_length(title) between 1 and 160),
  category    text not null check (char_length(category) between 1 and 60),
  notes       text check (char_length(notes) <= 1000),
  assignee    text check (assignee in ('hugo', 'laura', 'both')),
  due_date    date,
  done        boolean not null default false,
  sort_order  int not null default 0
);

create index if not exists checklist_items_sort_idx
  on public.checklist_items (sort_order, created_at);

alter table public.checklist_items enable row level security;

drop policy if exists "checklist read auth" on public.checklist_items;
create policy "checklist read auth"
  on public.checklist_items
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "checklist insert auth" on public.checklist_items;
create policy "checklist insert auth"
  on public.checklist_items
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "checklist update auth" on public.checklist_items;
create policy "checklist update auth"
  on public.checklist_items
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "checklist delete auth" on public.checklist_items;
create policy "checklist delete auth"
  on public.checklist_items
  for delete
  using (auth.role() = 'authenticated');

-- Realtime : chaque marié voit les modifications de l'autre en direct
-- (idempotent, comme pour carpool_entries).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'checklist_items'
  ) then
    alter publication supabase_realtime add table public.checklist_items;
  end if;
end $$;
