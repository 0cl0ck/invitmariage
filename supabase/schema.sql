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

-- Pas de policy UPDATE/DELETE => personne ne peut modifier/effacer via le site.
-- Les mariés modèrent depuis le dashboard Supabase (Table editor).

-- 3) Realtime : le tableau se met à jour en direct.
alter publication supabase_realtime add table public.carpool_entries;

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
  email      text not null check (char_length(email) between 3 and 120),
  attending  text not null check (attending in ('yes', 'no')),
  guests     int  check (guests between 0 and 20),
  children   int  check (children between 0 and 12),
  dietary    text check (char_length(dietary) <= 200),
  message    text check (char_length(message) <= 500)
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

-- Pas de policy UPDATE/DELETE : aucune modification/suppression via le site.

-- ---------------------------------------------------------------------------
-- Compte mariés pour le dashboard :
-- Supabase > Authentication > Users > "Add user" (email + mot de passe).
-- Ce compte sert à se connecter sur /espace-maries.
-- ---------------------------------------------------------------------------
