-- Migration du 04/10/2026 : invités de dernière minute.
-- À coller tel quel dans l'éditeur SQL Supabase, AVANT de déployer le code.
-- Idempotent : peut être rejoué sans risque.
--
-- Un foyer ajouté à la main par les mariés (ask_rsvp = true) reçoit un lien
-- qui demande aussi la présence, le régime / les allergies et un mot. La
-- réponse crée la ligne RSVP (visible dans /espace-maries) et confirme le menu,
-- en une seule transaction. Absent = foyer confirmé avec 0 personne.

alter table public.menu_households
  add column if not exists ask_rsvp boolean not null default false;

-- ---------------------------------------------------------------------------
-- answer_invite(...) : appelée par /api/menu (service_role) pour un foyer
-- ask_rsvp. Erreurs levées (message) : not-found, not-invite,
-- already-confirmed, invalid, bad-count (+ celles de confirm_menu).
-- ---------------------------------------------------------------------------
create or replace function public.answer_invite(
  p_token     text,
  p_attending text,
  p_adults    int,
  p_children  int,
  p_dietary   text,
  p_message   text,
  p_choices   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $invite$
declare
  h public.menu_households%rowtype;
  v_rsvp uuid;
begin
  select * into h from public.menu_households where token = p_token for update;
  if not found then
    raise exception 'not-found';
  end if;
  if not h.ask_rsvp then
    raise exception 'not-invite';
  end if;
  if h.confirmed_at is not null then
    raise exception 'already-confirmed';
  end if;
  if p_attending is null or p_attending not in ('yes', 'no') then
    raise exception 'invalid';
  end if;

  if p_attending = 'no' then
    p_adults := 0;
    p_children := 0;
    p_dietary := null;
    p_choices := '[]'::jsonb;
  elsif coalesce(p_adults, 0) < 0 or coalesce(p_children, 0) < 0
        or coalesce(p_adults, 0) + coalesce(p_children, 0) < 1 then
    raise exception 'bad-count';
  end if;

  -- A new answer (after « Rouvrir ») replaces the previous RSVP row.
  if h.rsvp_id is not null then
    delete from public.rsvp_responses where id = h.rsvp_id;
  end if;

  insert into public.rsvp_responses (variant, name, email, attending, guests, children, dietary, message, source)
  values (
    'derniere-minute',
    h.name,
    h.email,
    p_attending,
    p_adults + p_children,
    p_children,
    nullif(left(trim(coalesce(p_dietary, '')), 200), ''),
    nullif(left(trim(coalesce(p_message, '')), 500), ''),
    'guest'
  )
  returning id into v_rsvp;

  update public.menu_households
     set adults = p_adults, children = p_children, rsvp_id = v_rsvp
   where id = h.id;

  -- Saves the choices and locks the household (checks the counts again).
  perform public.confirm_menu(p_token, p_choices);
end $invite$;

-- Only the server (service_role) may call it.
revoke all on function public.answer_invite(text, text, int, int, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.answer_invite(text, text, int, int, text, text, jsonb) to service_role;

-- PostgREST (l'API Supabase) voit tout de suite la colonne et la fonction.
notify pgrst, 'reload schema';
