# Choix des menus : plan (24/09/2026)

## Objectif
Chaque foyer qui a répondu « oui » choisit, par personne, entrée, plat, fromage (oui/non) et parfum de gâteau.
Le choix est **définitif** une fois confirmé, et un email de confirmation part avec le récap. Les mariés récupèrent tout dans `/espace-maries`.

## Décisions (Hugo, 24/09)
- Gâteaux : **un parfum par gâteau**, quota de **20 parts par parfum** (trois chocolats, fruits rouges, exotique). Un parfum plein s'affiche « complet ».
- Emails : **Resend** sur `hugolaura.fr` (DNS chez OVH, 3 enregistrements à poser par Hugo). Réponses redirigées vers le Gmail d'Hugo.
- Date limite : **dimanche 27 septembre 2026**.
- Modification après confirmation : **mariés uniquement**, depuis l'espace mariés.

## Parcours
1. `/espace-maries/menus` : liste des foyers présents, statut (à envoyer, envoyé, choisi), bouton « Envoyer la demande » (foyers avec email) ou « Copier le lien » (foyers sans email, à passer par WhatsApp/SMS). Export CSV pour le restaurant, avec les totaux par plat.
2. Lien personnel `/menu/<jeton>` : une ligne par personne. Adultes : prénom, entrée, plat (carrelet, agneau, végétarien), fromage, parfum. Enfants : poulet ou poisson, parfum.
3. Récap, puis « Je confirme » : verrouillage, email de confirmation, le lien n'affiche plus que le récap.
4. FR + ES comme le reste du site.

## Technique
- Supabase : colonne `menu_token` (unique) sur le foyer, table `menu_choices` (une ligne par personne), lecture/écriture anon interdites (RLS).
- Fonctions serveur Vercel `website/api/` avec la clé service Supabase : lire le foyer par jeton, enregistrer + verrouiller, envoyer les emails (Resend).
- Quota gâteaux vérifié côté serveur au moment de la confirmation.
- `vercel.json` : exclure `/api` de la réécriture SPA.

## Variables d'environnement (Vercel, jamais dans git)
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`, `SITE_URL`.

## Points ouverts
- 60 parts de gâteau pour 60 adultes + enfants : à caler avec le restaurant.
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

## Prochaine action
1. Hugo : test de bout en bout avec son adresse (RSVP manuel avec son email, « Créer les liens manquants », bouton « Envoyer » de la ligne seulement, choix, confirmation, email reçu), puis suppression du foyer test.
2. Push de `feature/choix-menus`, PR vers `main` (accord d'Hugo).
3. Envoi réel aux foyers présents.
