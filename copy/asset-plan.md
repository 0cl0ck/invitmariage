# Asset Plan — Mariage Dunkerque

Liste **exhaustive** des médias nécessaires, leur format cible, leur emplacement, et la **règle anti-hallucination** qui encadre tout ce qui touche à l'Hôtel de Ville de Dunkerque.

> **MISE À JOUR (2026-06-20) :** les assets réels de la mairie ont été **fournis et approuvés**. Ils sont l'**unique source de vérité** pour l'Hôtel de Ville de Dunkerque. Voir §1.

---

## 0. RÈGLE ANTI-HALLUCINATION (NON NÉGOCIABLE)

> L'**Hôtel de Ville de Dunkerque** est un bâtiment réel. Il **ne doit jamais être** généré, halluciné, redessiné, réinterprété, remplacé ou inventé.

Concrètement :

1. **Image d'ouverture** et **vidéo d'approche** de la mairie = **uniquement** des fichiers **fournis par les mariés** (photo/vidéo réelles).
2. **Higgsfield (ou toute IA générative) ne crée pas la mairie de zéro.** Au mieux, et **seulement après accord explicite**, l'IA peut servir à :
   - étendre légèrement un ciel, stabiliser, étalonner les couleurs **d'une séquence réelle existante** ;
   - **jamais** à fabriquer le bâtiment, sa façade, son beffroi, ou un « équivalent » plausible.
3. **Traitement vidéo autorisé = uniquement ré-encodage / recadrage.** On ne réinvente pas visuellement la séquence. Pas de génération, pas de remplacement par de l'architecture IA, pas d'altération de l'identité / façade / proportions / lieu.
4. **Si les fichiers réels manquent** → on crée **uniquement des placeholders neutres** et **on attend**. On ne « bouche pas le trou » avec une image inventée.
5. Tout doute = on s'arrête et on demande. Aucun rendu de la mairie n'est livré sans source réelle validée.

---

## 1. Assets HÉROS — fournis & APPROUVÉS (réels)

Reçus le 2026-06-20, dans `assets/references/`. **Source de vérité unique** pour la mairie.

| ID | Fichier réel reçu | Rôle | Statut |
|---|---|---|---|
| `townhall-still` | `mairie-dunkerque-hero-first-frame.jpg` (~3,2 Mo) | **Poster héros** (image fixe d'ouverture, = 1ʳᵉ frame de la vidéo) | ✅ REÇU & APPROUVÉ |
| `townhall-approach` | `mairie-dunkerque-approach-reference.mp4` (~24 Mo) | **Source vidéo scrubbée au scroll** | ✅ REÇU & APPROUVÉ |
| `townhall-end-frame` | `mairie-dunkerque-hero-last-frame.png` (~0,6 Mo) | Image de fin (caméra centrée) — utilisable derrière la carte | ✅ REÇU |

**Décisions de traitement (conformes à la règle §0) :**
- Le poster du build provient de `mairie-dunkerque-hero-first-frame.jpg` → copié en `website/public/img/mairie-dunkerque-hero.jpg`.
- La vidéo est **ré-encodée en H.264 all-keyframe** (chaque frame = keyframe) pour un scrubbing fluide et frame-précis → `website/public/bg.mp4`. **Aucune retouche visuelle**, uniquement ré-encodage (+ recadrage/scale si nécessaire pour le poids web).
- La dernière frame (`...-last-frame.png`) reste disponible comme image nette de l'état final si besoin.

> ⚠️ Pas de version Higgsfield : `assets/videos/mairie-dunkerque-scroll-raw.mp4` n'existe pas et **n'est pas créé**. La vidéo réelle approuvée est utilisée directement.

---

## 2. Assets de CONTENU — fournis par les mariés (optionnels mais souhaités)

| ID | Description | Emplacement | Statut |
|---|---|---|---|
| `couple-photo` | 1 à 3 photos du couple (pour la section faire-part / clôture) | `assets/references/` | ⛔ non fourni (optionnel) |
| `monogram` | Monogramme / initiales des mariés (SVG de préférence) | `assets/decorative/` | ⛔ non fourni (optionnel) |
| `map-points` | Adresses exactes des lieux (mairie, vin d'honneur, réception) | (texte → `copy/`) | ⛔ non fourni (requis pour infos) |
| `ambient-audio` | Piste sonore d'ambiance (si souhaitée) | `assets/` | ⛔ non fourni (optionnel) |

---

## 3. Pipeline d'optimisation vidéo (EXÉCUTÉ au build)

Le scrub au scroll demande une vidéo **légère et à frames facilement décodables**. Mis en œuvre :

1. **Master conservé** intact dans `assets/references/mairie-dunkerque-approach-reference.mp4`.
2. **Ré-encodage all-keyframe H.264** via `scripts/encode-bg.mjs` (binaire `ffmpeg-static`, aucun ffmpeg système requis) → `website/public/bg.mp4` :
   - `-g 1 -keyint_min 1 -x264-params scenecut=0` → chaque frame est une keyframe (seek frame-précis).
   - `-pix_fmt yuv420p`, `-movflags +faststart` (lecture web), `-an` (audio inutile pour un fond).
3. **Stratégie de scrub retenue : vidéo HTML5** (`video.currentTime` piloté par ScrollTrigger). Le all-keyframe rend le seek fluide. Option « séquence de frames sur canvas » gardée en réserve si la perf mobile l'exige.
4. **Fallback** : poster fixe (`mairie-dunkerque-hero.jpg`) sur mobile et si `prefers-reduced-motion`.
5. Script de probe : `scripts/probe.mjs` (durée, résolution, fps, codec).

---

## 4. Placeholders neutres — PLUS NÉCESSAIRES pour la mairie

Les assets réels étant fournis, on n'utilise plus de placeholder pour la mairie. Les placeholders neutres ne subsistent que pour les **contenus non encore fournis** (photo couple, monogramme) et restent **visiblement** des placeholders.

---

## 5. Décor d'automne (générique — autorisé)

Éléments **génériques** (sans lien avec la mairie) → `assets/decorative/` : feuilles, textures papier, filets dorés. Si Higgsfield est un jour utilisé (après accord), **uniquement** pour ce décor générique, **jamais** pour la mairie. Voir [higgsfield-video-prompt.md](./higgsfield-video-prompt.md).

---

## 6. Verdict de suffisance pour la phase de BUILD

**✅ SUFFISANT pour construire l'expérience héros + faire-part.**

- Poster héros : ✅ disponible.
- Vidéo d'approche scrubbée : ✅ disponible et approuvée.
- Image de fin : ✅ disponible (bonus).

**Non bloquant mais à fournir avant la mise en ligne** (le site se construit avec des placeholders texte en attendant) :
- Prénoms, **date**, **adresses** exactes (mairie / vin d'honneur / réception), **date limite RSVP**, contact.
- Choix du **backend RSVP** (cf. [rsvp-rules.md](./rsvp-rules.md) §4).
- Optionnel : photo(s) du couple, monogramme, audio d'ambiance.
