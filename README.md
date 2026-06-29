# Mariage Dunkerque — Invitation cinématographique

Faire-part de mariage **web, cinématographique au défilement**, centré sur l'**Hôtel de Ville de Dunkerque** réel. Le visiteur arrive devant la mairie, s'en approche via une vidéo scrubbée au scroll, puis découvre le faire-part et répond (RSVP).

> **État actuel : PLANIFICATION uniquement.** Aucune image/vidéo générée, aucun crédit dépensé, site non encore développé.

---

## ⚠️ Règle absolue — la mairie réelle

L'**Hôtel de Ville de Dunkerque** ne doit **jamais** être généré, halluciné, redessiné, réinterprété ou inventé. Il provient **exclusivement** d'assets réels fournis par les mariés. Tant qu'ils manquent → **placeholders neutres** et on attend. Détails : [`copy/asset-plan.md`](./copy/asset-plan.md).

---

## Stack technique

| Domaine | Choix |
|---|---|
| Build | **Vite** |
| UI | **React** (JavaScript) |
| Animation | **GSAP** + **ScrollTrigger** |
| Smooth scroll | **Lenis** |
| Styles | **CSS variables** (cf. design system) |
| Génératif (décor générique seulement, après accord) | Higgsfield MCP — **jamais pour la mairie** |
| Déploiement (à confirmer) | Vercel (front) / RSVP backend à décider |

---

## Structure du projet

```
mariage-dunkerque-invitation/
├── assets/
│   ├── references/    # photos réelles (mairie, couple) — FOURNIES par les mariés
│   ├── videos/        # vidéo d'approche réelle + versions optimisées
│   └── decorative/    # décor générique (feuilles, textures, dorures, monogramme)
├── copy/              # tous les fichiers de planification & textes
│   ├── wedding-brief.md          # concept, mariés, parcours, variantes
│   ├── design-system.md          # palette automne + variables CSS + typo + motion
│   ├── asset-plan.md             # médias requis + RÈGLE anti-hallucination
│   ├── rsvp-rules.md             # variantes A/B + champs + backend RSVP
│   ├── higgsfield-video-prompt.md# garde-fous + prompts décor (en attente)
│   └── website-copy.md           # plan section par section + textes
├── scripts/           # (vide) futurs scripts (optimisation vidéo, extraction frames)
├── website/           # (vide) future app Vite/React
└── README.md          # ce fichier
```

---

## Documents de planification

1. [`copy/wedding-brief.md`](./copy/wedding-brief.md) — le concept, les mariés, le parcours, les deux variantes.
2. [`copy/design-system.md`](./copy/design-system.md) — design system automne, variables CSS, typographie, motion.
3. [`copy/asset-plan.md`](./copy/asset-plan.md) — médias nécessaires, pipeline vidéo, **règle anti-hallucination**, placeholders.
4. [`copy/rsvp-rules.md`](./copy/rsvp-rules.md) — variantes A/B, champs RSVP, options de backend, confidentialité.
5. [`copy/higgsfield-video-prompt.md`](./copy/higgsfield-video-prompt.md) — usage encadré de Higgsfield (décor générique uniquement, après accord).
6. [`copy/website-copy.md`](./copy/website-copy.md) — plan détaillé du site, section par section, avec les textes.

---

## Workflow de build (étapes suivantes — pas encore réalisées)

1. **Valider la planification** (ces fichiers) : noms, date, lieux, variante par défaut, backend RSVP.
2. **Recevoir les assets réels** de la mairie (photo fixe + vidéo d'approche) — *bloquant pour l'expérience héros*.
3. **Initialiser l'app** dans `website/` : `pnpm create vite` (React + JS), ajouter `gsap`, `@studio-freight/lenis`.
4. **Poser le design system** : variables CSS depuis [`design-system.md`](./copy/design-system.md), fonts self-hosted, layout de base.
5. **Construire la scène cinématographique** : canvas plein écran, intégration image → scrub vidéo (HTML5 `currentTime` ou séquence de frames sur `<canvas>` — choix après test perf), Lenis + ScrollTrigger.
6. **Optimiser la vidéo** : scripts dans `scripts/` (compression, extraction de frames), fallback image + `prefers-reduced-motion`.
7. **Monter le contenu** : faire-part, programme (selon variante), infos, clôture (textes depuis [`website-copy.md`](./copy/website-copy.md)).
8. **Implémenter le RSVP** : formulaire selon variante, backend retenu, notifications, export.
9. **QA** : mobile-first, perf du scrub, accessibilité, `noindex`.
10. **Déploiement** : front (Vercel) + backend RSVP, lien privé partagé aux invités.

> Étapes 3→10 = phase de build, **à ne lancer qu'après validation** et réception des assets.

---

## Règles du projet (rappel)

- 🚫 Ne pas générer d'image. 🚫 Ne pas générer de vidéo. 🚫 Ne pas dépenser de crédits Higgsfield.
- 🚫 Ne pas inventer la mairie de Dunkerque.
- 🚫 Ne pas construire le site tant que la planification n'est pas validée.
- ✅ `pnpm` uniquement. ✅ TypeScript habituellement — **ici JavaScript** (demande explicite). ✅ Communication en français, code en anglais.
