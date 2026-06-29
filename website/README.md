# website — Invitation mariage Dunkerque

Application **Vite + React (JavaScript)** : expérience cinématographique au scroll
sur l'Hôtel de Ville de Dunkerque (vidéo réelle scrubbée), puis faire-part + RSVP.

Stack : Vite · React · GSAP + ScrollTrigger · Lenis · variables CSS · fonts self-hostées.

## Démarrer

```bash
pnpm install
pnpm dev            # http://localhost:5173 → redirige vers /ceremonie
```

Routes (deux variantes d'invitation) :
- `/ceremonie` — journée complète (cérémonie civile à la mairie, cérémonie religieuse, vin d'honneur).
- `/vin-dhonneur` — soirée uniquement (ne mentionne jamais mairie / église / cérémonie).

## Build

```bash
pnpm build --base=./        # sortie dans dist/ (pnpm transmet le flag à vite)
pnpm preview                # prévisualiser le build
```

> Note : avec **pnpm**, écrire `pnpm build --base=./` (sans le `--`).
> L'équivalent npm serait `npm run build -- --base=./`.

> `--base=./` produit des chemins relatifs. Les routes sont en mode *history*
> (BrowserRouter) ; pour un hébergement statique, un *fallback SPA* est requis :
> `public/_redirects` (Netlify) et `vercel.json` (Vercel) sont déjà fournis.

## Assets — héros au scroll (frames sur canvas)

Le héros n'utilise PAS une `<video>` scrubbée (le seek vidéo est bridé sur mobile →
saccades). La vidéo réelle est **pré-extraite en frames WebP** dessinées sur un
`<canvas>` au scroll → fluide sur **tous** les appareils.

- `public/frames/frame-XXX.webp` — ~105 frames 1280×720 (même résolution que la
  source), générées par `../scripts/extract-frames.mjs`. **Jamais générées par IA**
  — cf. `../copy/asset-plan.md`.
- `src/lib/frames-manifest.js` — auto-généré (nombre de frames, format).
- Régénérer : `node ../scripts/extract-frames.mjs [fps] [quality]` (défaut 18/72 ;
  on a utilisé `13 58` pour ~105 frames / ~7,7 Mo).

## Hooks de debug (console navigateur)

- `window.__lenis` — instance Lenis (`null` si `prefers-reduced-motion`).
- `window.__ST` — `ScrollTrigger` de GSAP.
- `window.__bgv` — le `<canvas>` de fond (héros).

## Fallbacks

- **`prefers-reduced-motion`** : 1ʳᵉ frame statique, carte affichée immédiatement, animations neutralisées.
- Le scrub par frames fonctionne sur mobile et desktop (plus de fallback poster statique sur mobile).

## Covoiturage (Supabase)

Section `#covoiturage` : tableau **2 colonnes** « Je propose / Je cherche », partagé
entre tous les invités et mis à jour **en temps réel**. Backend : **Supabase**.

Mise en route :

1. Créer un projet sur [supabase.com](https://supabase.com).
2. SQL Editor → exécuter [`../supabase/schema.sql`](../supabase/schema.sql)
   (table `carpool_entries` + RLS lecture/insertion seules + realtime).
3. `cp .env.example .env.local` puis renseigner `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. Relancer `pnpm dev` (ou redéployer). Sur Vercel : définir ces deux variables
   d'environnement dans les settings du projet.

**Sans clés configurées**, le tableau fonctionne en **mode démo local**
(`localStorage`, par appareil) — visible mais non partagé. Couche d'accès :
[`src/lib/carpool.js`](src/lib/carpool.js) (bascule Supabase ⇄ local automatique).
Modération : les mariés suppriment une annonce depuis le dashboard Supabase
(aucune suppression possible depuis le site, par sécurité).

## RSVP + dashboard mariés (Supabase)

- Le formulaire s'adapte à la variante. Chaque envoi = une ligne en base
  (`rsvp_responses`, insertion seule). **Correction** : le formulaire se
  pré-remplit avec la dernière réponse de l'appareil (`localStorage`), affiche
  un bouton « Modifier ma réponse », et le dashboard garde la **plus récente par
  email**. Couche : [`src/lib/rsvp.js`](src/lib/rsvp.js).
- **Dashboard mariés** : page privée [`/espace-maries`](src/components/AdminPage.jsx)
  (non liée, hors expérience cinématique). Récap présents / absents / personnes
  attendues, tableau, **export CSV**.
- **Sécurité** : la lecture des réponses est réservée aux mariés **connectés**
  (Supabase Auth) ; les invités (clé anon) ne peuvent qu'insérer. Créer le compte
  des mariés : Supabase → Authentication → Users → Add user (email + mot de passe),
  puis se connecter sur `/espace-maries`.
- **Sans Supabase configuré** : RSVP et dashboard tournent en **mode démo local**
  (`localStorage`, par appareil), sans authentification.

## Mise en route Supabase (résumé)

1. Créer un projet [supabase.com](https://supabase.com).
2. SQL Editor → exécuter [`../supabase/schema.sql`](../supabase/schema.sql)
   (tables `carpool_entries` + `rsvp_responses`, RLS, realtime).
3. Authentication → Users → Add user (email + mot de passe des mariés).
4. `cp .env.example .env.local` → renseigner `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API). Sur Vercel : mêmes variables
   dans les settings du projet.
5. `pnpm dev` / redeploy. Voir `../copy/rsvp-rules.md` §4.
