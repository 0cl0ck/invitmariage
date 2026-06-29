# Design System — Automne / Dunkerque

Système de design **automne haut de gamme**. Tout passe par des **variables CSS** (`:root`) pour rester cohérent et facilement ajustable. Valeurs ci-dessous = **proposition de départ**, à valider avant build.

---

## 1. Principes

- **Sobriété** : peu d'éléments, beaucoup de respiration. Le décor (mairie + vidéo) porte l'émotion ; la typo et la couleur restent discrètes.
- **Chaleur d'automne** : palette cuivre / ocre / bordeaux sur fond crème profond.
- **Matière** : grain de papier subtil, dorure **mate** (jamais brillante/néon), ombres douces.
- **Hiérarchie typographique forte** : une serif d'affichage élégante + une sans-serif fine pour le corps.
- **Mouvement = caméra** : les animations servent la narration, jamais la décoration gratuite.

---

## 2. Palette — variables CSS

```css
:root {
  /* --- Fonds --- */
  --color-bg: #1c1410;          /* brun nuit profond (fond cinématographique) */
  --color-bg-soft: #2a1f17;     /* brun chaud pour blocs */
  --color-cream: #f4ece0;       /* crème / ivoire (texte sur fond sombre, cartes) */
  --color-paper: #efe3d2;       /* papier texturé du faire-part */

  /* --- Accents automne --- */
  --color-burgundy: #6e1f2a;    /* bordeaux / vin */
  --color-rust: #a8451f;        /* terre cuite / rouille */
  --color-amber: #c97e2c;       /* ambre / ocre doré */
  --color-gold: #c9a24b;        /* dorure mate (accents, filets) */
  --color-olive: #5d5a32;       /* vert olive (feuillage discret) */

  /* --- Texte --- */
  --color-text: #f4ece0;        /* texte principal sur fond sombre */
  --color-text-muted: #c8b8a4;  /* texte secondaire */
  --color-text-ink: #2a1f17;    /* texte sur fond clair (carte papier) */

  /* --- Lignes & overlays --- */
  --color-line: rgba(201, 162, 75, 0.35);  /* filets dorés */
  --overlay-vignette: rgba(20, 14, 10, 0.55);

  /* --- Typographie --- */
  --font-display: "Cormorant Garamond", "Playfair Display", Georgia, serif;
  --font-body: "Jost", "Montserrat", system-ui, sans-serif;
  --font-script: "Tangerine", "Pinyon Script", cursive; /* signatures / prénoms, usage parcimonieux */

  /* Échelle typographique (clamp = responsive fluide) */
  --fs-hero: clamp(2.75rem, 8vw, 6rem);
  --fs-h2:   clamp(1.75rem, 4vw, 3rem);
  --fs-h3:   clamp(1.25rem, 2.5vw, 1.75rem);
  --fs-body: clamp(1rem, 1.2vw, 1.125rem);
  --fs-small: 0.875rem;
  --tracking-wide: 0.22em;   /* lettrage espacé pour les sur-titres */
  --leading-body: 1.7;

  /* --- Espacement (échelle 4px) --- */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2.5rem;
  --space-6: 4rem;
  --space-7: 6rem;
  --section-pad: clamp(3rem, 8vw, 8rem);
  --content-max: 68rem;     /* largeur max de contenu */
  --card-max: 34rem;        /* largeur max du faire-part */

  /* --- Rayons & ombres --- */
  --radius-sm: 4px;
  --radius-card: 2px;       /* le papier reste anguleux, élégant */
  --shadow-card: 0 24px 60px -20px rgba(0,0,0,0.6);
  --shadow-soft: 0 10px 30px -12px rgba(0,0,0,0.45);

  /* --- Motion --- */
  --ease-cinema: cubic-bezier(0.22, 1, 0.36, 1);  /* easeOutExpo-like */
  --dur-fast: 0.35s;
  --dur-base: 0.6s;
  --dur-slow: 1.2s;

  /* --- Layout cinématographique --- */
  --z-canvas: 0;     /* image/vidéo de la mairie */
  --z-overlay: 10;   /* vignettes, dégradés */
  --z-content: 20;   /* texte, carte */
  --z-ui: 30;        /* indicateur de scroll, RSVP flottant */
}
```

> **Dorure mate** : `--color-gold` reste désaturé. Pas de `#ffd700`, pas de gradient or brillant. La noblesse vient de la retenue.

---

## 3. Typographie — usage

| Rôle | Police | Style |
|---|---|---|
| Prénoms des mariés / hero | `--font-display`, poids 500–600, italique possible | grand, aéré |
| Titres de section (H2) | `--font-display` | + sur-titre en sans-serif espacé |
| Sur-titres / kicker | `--font-body`, `text-transform: uppercase`, `letter-spacing: var(--tracking-wide)` | petit, discret |
| Corps de texte | `--font-body`, poids 300–400, `line-height: var(--leading-body)` | lisible |
| Signature finale | `--font-script` | usage rare, une seule fois |

**Chargement** : self-host des fonts (via `@fontsource/*` ou fichiers locaux dans `website/`) pour la perf et la confidentialité. `font-display: swap`.

---

## 4. Motion — direction

- **Lenis** pilote le smooth scroll (inertie douce). GSAP `ScrollTrigger` synchronise la scène.
- **Scrub vidéo** : la timeline vidéo est liée à la progression du scroll (`scrub: true`), pas au temps réel.
- **Apparitions** : fade + léger `translateY` (16–24px) avec `--ease-cinema`, en `stagger` léger.
- **Carte du faire-part** : apparaît par fade + scale subtil (0.96 → 1) une fois la mairie « centrée ».
- **Respect de `prefers-reduced-motion`** : pas de scrub, image fixe + fondus discrets, contenu immédiatement lisible.

---

## 5. Éléments décoratifs d'automne

- Feuilles (érable, chêne, ginkgo) en **SVG/PNG discrets** dans `assets/decorative/` — accents en coin, jamais envahissants.
- Filets dorés fins (`--color-line`) pour encadrer la carte.
- Grain de papier / léger bruit en overlay (très faible opacité).
- **Tout élément décoratif est générique** (feuillages, textures) et **n'inclut jamais** de reconstitution de la mairie.

---

## 6. Responsive & accessibilité

- **Mobile-first.** Tester le scrub vidéo sur mobile en priorité ; prévoir un fallback image si la perf est insuffisante.
- Contraste texte/fond ≥ WCAG AA (le crème sur brun nuit passe largement).
- Cibles tactiles ≥ 44px. Focus visible sur les champs RSVP.
- Pas d'information transmise uniquement par la couleur.
