# Choix des menus : plan (24/09/2026)

## Objectif
Chaque foyer qui a répondu « oui » choisit, par personne, entrée, plat et fromage (oui/non). Le gâteau se choisit sur place (décision du 28/09, plus de champ ni de quota).
Le choix est **définitif** une fois confirmé, et un email de confirmation part avec le récap. Les mariés récupèrent tout dans `/espace-maries`.

## Décisions (Hugo, 24/09)
- Gâteaux : ~~un parfum par gâteau, quota de 20 parts~~ **abandonné le 28/09** : le choix du gâteau se fait sur place.
- Emails : **Resend** sur `hugolaura.fr` (DNS chez OVH, 3 enregistrements à poser par Hugo). Réponses redirigées vers le Gmail d'Hugo.
- Date limite : **dimanche 27 septembre 2026**.
- Modification après confirmation : **mariés uniquement**, depuis l'espace mariés.

## Parcours
1. `/espace-maries/menus` : liste des foyers présents, statut (à envoyer, envoyé, choisi), bouton « Envoyer la demande » (foyers avec email) ou « Copier le lien » (foyers sans email, à passer par WhatsApp/SMS). Export CSV pour le restaurant, avec les totaux par plat.
2. Lien personnel `/menu/<jeton>` : une ligne par personne. Adultes : prénom, entrée, plat (carrelet, agneau, végétarien), fromage. Enfants : poulet ou poisson.
3. Récap, puis « Je confirme » : verrouillage, email de confirmation, le lien n'affiche plus que le récap.
4. FR + ES comme le reste du site.

## Technique
- Supabase : colonne `menu_token` (unique) sur le foyer, table `menu_choices` (une ligne par personne), lecture/écriture anon interdites (RLS).
- Fonctions serveur Vercel `website/api/` avec la clé service Supabase : lire le foyer par jeton, enregistrer + verrouiller, envoyer les emails (Resend).
- `vercel.json` : exclure `/api` de la réécriture SPA.

## Variables d'environnement (Vercel, jamais dans git)
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`, `SITE_URL`.

## Points ouverts
- Le RSVP est par foyer : le nombre de personnes vient de `guests` + `children`.

## État (24/09 soir)
- SQL `supabase/menus.sql` appliqué en prod par Hugo (en deux fois : l'éditeur Supabase tronquait le collage).
- Code écrit sur `feature/choix-menus`, non commité : `website/api/` (menu.js, menu-send.js, _lib), `src/pages/MenuPage.jsx`, `src/components/MenusAdminPage.jsx`, `src/lib/menus.js`, `src/content/menu.js`.
- Vérifié : SQL sur PGlite (quota gâteaux, double confirmation, enfants), lint, build, parcours navigateur en mode démo (FR/ES, quota, verrouillage, totaux), rendu des deux emails.
- Non vérifié : fonctions /api avec la vraie base et Resend (clés « Sensitive », illisibles depuis le VPS).

## Review (24/09)
Codex + Grok : NE PAS SHIP sur la v1. Corrigé : envoi réservé aux emails des mariés (`MARIES_EMAILS`), lien unique par RSVP (index 7b de menus.sql, à appliquer), réouverture sans perte, CSV anti-formules, email masqué dans /api/menu, statut réel de l'email de confirmation, effectifs figés après confirmation.
Choix : date limite affichée mais non bloquante (sinon « Rouvrir » est inutilisable après le 27/09). Non traité : reprise automatique d'un email de confirmation échoué.
Gemini : bloqué plus de 25 min sans sortie, arrêté.

## État (28/09)
- Index 7b appliqué et inscriptions Supabase désactivées (Hugo, confirmé le 28/09).
- Date limite affichée passée au **dimanche 4 octobre** (le 27/09 était échu).
- Commit local `3a20a5d` sur `feature/choix-menus`, non poussé.
- **Déployé en prod** le 28/09 via `CONFIRM_SHIP=1 vercel deploy --prod --yes` **depuis la racine du repo** (Root Directory Vercel = `website`, la commande échoue si on la lance depuis `website/`). `.vercel/` copié à la racine et ignoré.
- Vérifié en ligne : `/api/menu` répond en JSON (404 `not-found` sur un jeton inconnu, donc clé service Supabase OK), le bundle contient `/menu/:token` et `/espace-maries/menus`.
- Non encore testé : envoi Resend réel et email de confirmation (test avec l'adresse d'Hugo à faire depuis l'espace mariés).

## Retrait du gâteau (28/09)
- Décision d'Hugo : le gâteau se choisit sur place. Champ, quota, comptage et colonne retirés partout (SQL, /api, emails, page invité, espace mariés, CSV, totaux).
- Migration **`supabase/2026-09-28-sans-gateau.sql`** à coller dans Supabase **avant** le déploiement (la prod du 28/09 matin insère encore `cake`, le nouveau code ne le fait plus : les deux étapes doivent s'enchaîner, aucun lien invité n'ayant encore été envoyé). Testée sur PGlite : schéma du 24/09 + migration, confirmation OK, rejouable.
- `supabase/menus.sql` reste le schéma de référence (à jour, section 8 = même migration).

## Prochaine action
1. Hugo : test de bout en bout avec son adresse (RSVP manuel avec son email, « Créer les liens manquants », bouton « Envoyer » de la ligne seulement, choix, confirmation, email reçu), puis suppression du foyer test.
2. Push de `feature/choix-menus`, PR vers `main` (accord d'Hugo).
3. Envoi réel aux foyers présents.

## Choix par les mariés (02/10)
- Demande d'Hugo : choisir les menus à la place des foyers sans email, ou trop âgés pour utiliser le lien.
- Branche `feature/menus-par-les-maries` (depuis `feature/choix-menus`, état prod). Bouton « Choisir pour eux » (ou « Changer les menus » si déjà confirmé, formulaire pré-rempli) sur chaque ligne de `/espace-maries/menus`.
- `POST /api/menu-admin { id, choices }` : session des mariés obligatoire (`requireMaries`), déverrouille si déjà confirmé, appelle `confirm_menu`, remet l'ancien verrou si l'appel échoue. **Aucun email à l'invité** ; son lien affiche ensuite le récap verrouillé. Aucune migration SQL.
- Vérifié : lint, build, handler testé avec une fausse base (401 sans session ou hors liste blanche, 400, 404, premier choix, modification, échec avec verrou rétabli), parcours navigateur en mode démo (desktop + mobile 390 px, totaux, lien invité verrouillé).
- Non vérifié : appel réel à Supabase en prod (clé service illisible depuis le VPS).

## Invités de dernière minute (04/10)
- Demande d'Hugo : un seul email pour les retardataires, qui donnent leur présence, leur régime / allergies, un mot et leur menu.
- `/espace-maries/menus` › « + Invité de dernière minute » (nom, email, nombre proposé) crée un foyer `ask_rsvp = true`. « Envoyer » part avec l'email d'invitation (`inviteEmail`, FR/ES, lien vers le site pour le programme), sinon « Copier le lien ».
- Page `/menu/<jeton>` : présent / absent ; si présent, adultes et enfants (modifiables), régime / allergies, menus, un mot, récap, confirmation (+ email récap). Si absent : un mot, fin.
- Base : `answer_invite()` écrit la ligne RSVP (`variant = 'derniere-minute'`, visible dans « Réponses ») et confirme le menu dans la même transaction ; absent = foyer confirmé avec 0 personne (« ✗ Absent » dans l'espace mariés). « Rouvrir » permet une nouvelle réponse, qui remplace la ligne RSVP.

## Entrée facultative, allergies, liste restaurant (04/10)
- « Sans entrée » proposé aux invités et dans « Choisir pour eux / Changer les menus » (stocké `starter = null`).
- `menu_choices.allergy` : allergie par personne, corrigée par les mariés (le texte libre du RSVP reste intact et s'affiche à côté). Recopiée par `confirm_menu`, donc « Changer les menus » ne l'efface pas.
- `/espace-maries/restaurant` : liste par personne (prénom, entrée, plat, fromage, allergie corrigeable), foyers sans menu signalés, impression / PDF : page 1 = fiche allergies cuisine et service (pictos 🥩 🥣 🐟 🐑 🌱 🍗 🐠 🧀 et ⚠️), page 2 = totaux + liste. Aide-mémoire proposé : le picto du plat et ⚠️ sur chaque marque-place.

## Plus de date limite + aperçu des emails (04/10)
- Décision d'Hugo : aucune date affichée, « dès que possible » partout (page du lien menu, email de demande de menu, section RSVP du site d'invitation que les retardataires voient via « Programme et infos pratiques »). `rsvpDeadline` reste dans `variants.js`, inutilisé côté invités.
- Bouton « Aperçu » sur chaque ligne non confirmée de `/espace-maries/menus` : `POST /api/menu-send { ids, preview: true }` envoie le même email (invitation ou demande) au marié connecté uniquement, objet « [Aperçu] … », sans rien marquer comme envoyé. Le lien est celui du foyer : l'ouvrir pour voir la page, ne pas confirmer à sa place.

## Menu enfant facultatif + texte de l'invitation (04/10, après le merge de la PR #3)
- Vérifié le 04/10 : les migrations 1 et 2 sont appliquées en prod (colonnes `ask_rsvp` et `allergy` présentes via l'API publique, sans lire de données).
- « Pas de menu enfant » pour les tout-petits (invités et mariés), stocké `main = null` ; un adulte garde un plat obligatoire (`main is not null` explicite dans la contrainte : une CHECK évaluée à NULL passe). Migration `supabase/2026-10-04-menu-enfant-facultatif.sql` à coller AVANT le merge, sinon un tout-petit sans menu fait une erreur.
- Email d'invitation : « Dites-nous si vous serez présents, vos éventuels régimes ou allergies, et choisissez le menu de chacun. » (plus de « Sur une seule page », ni « Cela prend deux minutes »), ES équivalent.

## PDF restaurant : prénoms seulement (04/10, après le merge de la PR #4)
- Demande d'Hugo : pas de nom de famille sur le PDF envoyé au restaurant. À l'impression : plus de colonne « Foyer », plus de nom de foyer sur les cartes allergies, les foyers sans menu deviennent « N personne(s) n'ont pas encore choisi leur menu ». À l'écran, les noms de foyer restent (pour corriger).
- Prénoms en double signalés à l'écran (et avant l'impression) : ajouter une initiale dans la colonne « Prénom » pour que la cuisine ne confonde pas deux « Marie ».
- 05/10 : prénom corrigeable directement dans la liste (comme l'allergie, `updateChoice`), prénoms en plusieurs mots signalés (nom de famille possible). Fiche allergies en tableau compact (Prénom · Allergie · Entrée · Plat · Fromage), noms de plats courts, pictos dans une colonne de largeur fixe (alignés), légende en grille : tient sur une page A4 (vérifié avec 30 allergies, mode dense au-delà de 22). Liste complète à colonnes fixes : un plat par ligne.

## Mise en prod du 04/10 (ordre obligatoire)
1. Coller dans l'éditeur SQL Supabase, dans cet ordre : `supabase/2026-10-04-invites-derniere-minute.sql` puis `supabase/2026-10-04-entree-facultative-allergies.sql` (idempotents). Contrôle : `select ask_rsvp from menu_households limit 1; select allergy from menu_choices limit 1;` ne renvoient pas d'erreur.
2. Merge de la PR dans `main` = déploiement Vercel de production.
- Si le code part avant le SQL : les liens existants continuent de marcher (lecture en `select *`), mais l'ajout d'un retardataire, « Sans entrée » et les allergies échouent avec un message d'erreur.
- Vérifié : SQL sur PGlite (oui / non / rollback complet / réponse remplacée après « Rouvrir » / droits / contrainte retrouvée par sa définition / allergie conservée), handlers avec une fausse base (routage, erreurs, emails FR/ES), parcours navigateur en mode démo (desktop, mobile 390 px, impression PDF).
- Non vérifié : Supabase et Resend réels.
