# Website Copy & Section Plan — Mariage Dunkerque

Plan **section par section** du site, avec le **rôle narratif**, le **mécanisme d'animation** et les **textes** (placeholders entre crochets `[…]`). Les textes sont des propositions, à valider et personnaliser.

Stack rappel : Vite + React + GSAP/ScrollTrigger + Lenis, variables CSS (cf. [design-system.md](./design-system.md)).

---

## Vue d'ensemble du scroll (la « caméra »)

```
[0]  Ouverture        — photo fixe mairie (plein écran)
[1]  Approche         — vidéo scrubbée, on avance vers la mairie
[2]  Arrivée          — caméra centrée, mouvement figé
[3]  Faire-part       — la carte apparaît au centre
[4]  Notre histoire   — (optionnel) court intermède
[5]  Le programme     — déroulé du jour (varie selon variante A/B)
[6]  Infos pratiques  — lieux, accès, hébergement
[7]  RSVP             — l'action unique et forte
[8]  Clôture          — remerciement & signature
```

Chaque section = un `ScrollTrigger`. Les sections 0→2 partagent **le même canvas plein écran** (la mairie) ; le texte se superpose en `--z-content`.

---

## [0] Ouverture — la mairie en grand

- **Rôle :** poser le lieu et l'émotion immédiatement. Le visiteur reconnaît Dunkerque.
- **Visuel :** `townhall-still` (photo réelle) plein écran + vignette douce (`--overlay-vignette`). *(Placeholder neutre tant que l'image réelle manque — cf. [asset-plan.md](./asset-plan.md).)*
- **Animation :** au chargement, fade-in du visuel puis apparition lente du titre. Indicateur de scroll discret en bas (« faites défiler »).
- **Copy :**
  - Sur-titre (kicker) : `DUNKERQUE · AUTOMNE [ANNÉE]`
  - Titre : `[PRENOM_A] & [PRENOM_B]`
  - Sous-titre : `Nous nous marions`
  - Micro-indication : `↓ Faites défiler`

---

## [1] Approche — la vidéo scrubbée

- **Rôle :** « entrer dans la scène », créer le moment cinématographique.
- **Visuel :** `townhall-approach` (vidéo réelle) scrubbée au scroll (`scrub`). *(Placeholder + barre de progression factice tant que la vidéo réelle manque.)*
- **Animation :** progression vidéo liée au scroll via ScrollTrigger ; léger réchauffement de la lumière (overlay ambre qui s'estompe). `prefers-reduced-motion` → image fixe.
- **Copy :** quasi inexistant pour ne pas casser l'immersion. Optionnel, en fondu :
  - `Le [JOUR] [DATE_MARIAGE]`

---

## [2] Arrivée — la caméra se pose

- **Rôle :** transition entre le décor et le message ; le mouvement s'arrête sur la mairie centrée.
- **Visuel :** dernière frame (`townhall-end-frame`), caméra centrée, vignette qui se renforce légèrement pour faire ressortir le contenu à venir.
- **Animation :** fin du scrub ; le fond se fige et s'assombrit doucement ; le filet doré du faire-part commence à se tracer.
- **Copy :**
  - `C'est ici, à l'Hôtel de Ville de Dunkerque,`
  - `que tout commence.`

---

## [3] Le faire-part — la carte centrale

- **Rôle :** le cœur de l'invitation. Élégance maximale, peu d'éléments.
- **Visuel :** carte papier (`--color-paper`) encadrée d'un filet doré, posée au centre sur le fond mairie assombri. Monogramme optionnel en tête.
- **Animation :** fade + scale (0.96 → 1) avec `--ease-cinema` ; lignes de texte en `stagger` doux.
- **Copy (carte) :**
  - Sur-titre : `AVEC JOIE`
  - `[PRENOM_A] & [PRENOM_B]`
  - `ont le bonheur de vous convier à leur mariage`
  - `Le [DATE_MARIAGE_LONGUE]`
  - `Hôtel de Ville de Dunkerque`
  - Filet · `Cérémonie · Vin d'honneur · Soirée` *(adapté selon variante)*

---

## [4] Notre histoire *(optionnel)*

- **Rôle :** respiration narrative, touche personnelle.
- **Visuel :** photo(s) du couple (`couple-photo`) + texte court ; feuillages discrets en coin.
- **Animation :** apparition au scroll, parallaxe légère sur la photo.
- **Copy :**
  - Sur-titre : `NOUS DEUX`
  - `[Quelques lignes sur la rencontre / l'histoire du couple — à écrire par les mariés.]`

> Section activable/désactivable selon le souhait des mariés.

---

## [5] Le programme du jour

- **Rôle :** informer clairement du déroulé. **Contenu adapté à la variante** (cf. [rsvp-rules.md](./rsvp-rules.md)).
- **Visuel :** frise verticale (timeline) avec horaires, icônes sobres, filets dorés.
- **Animation :** chaque étape apparaît en `stagger` à mesure du scroll.

**Variante A — Journée complète :**
| Heure | Étape | Lieu |
|---|---|---|
| `[H]` | Cérémonie civile | Hôtel de Ville de Dunkerque |
| `[H]` | `[Cérémonie religieuse/laïque]` *(si applicable)* | `[LIEU]` |
| `[H]` | Vin d'honneur | `[LIEU_VIN_HONNEUR]` |
| `[H]` | Dîner | `[LIEU_RECEPTION]` |
| `[H]` | Soirée dansante | `[LIEU_RECEPTION]` |

**Variante B — Soirée :**
| Heure | Étape | Lieu |
|---|---|---|
| `[H]` | Vin d'honneur | `[LIEU_VIN_HONNEUR]` |
| `[H]` | Soirée dansante | `[LIEU_RECEPTION]` |

---

## [6] Infos pratiques

- **Rôle :** lever tous les freins logistiques.
- **Visuel :** cartes/blocs sobres ; liens vers cartes (Google/Apple Maps) ; éventuellement mini-carte statique.
- **Copy (blocs) :**
  - **Accès & stationnement :** `[Indications parking / transports]`
  - **Hébergement :** `[Suggestions d'hôtels / chambres — optionnel]`
  - **Dress code :** `[Tenue souhaitée — ex. « élégance d'automne »]` *(optionnel)*
  - **Cadeaux / cagnotte :** `[Lien ou message — optionnel]`
  - **Enfants :** `[Mention si l'événement est avec/sans enfants]` *(optionnel)*

---

## [7] RSVP — l'action unique

- **Rôle :** convertir. Une seule action claire, sans distraction.
- **Visuel :** formulaire épuré sur fond chaud ; bouton doré mat.
- **Comportement :** champs selon la variante (cf. [rsvp-rules.md](./rsvp-rules.md)) ; validation ; messages de confirmation.
- **Copy :**
  - Sur-titre : `VOTRE RÉPONSE`
  - Titre : `Serez-vous des nôtres ?`
  - Sous-texte : `Merci de répondre avant le [DATE_LIMITE_RSVP].`
  - Bouton : `J'envoie ma réponse`
  - Confirmation présent : `Merci, nous avons hâte de vous voir !`
  - Confirmation absent : `Merci de nous avoir prévenus, vous nous manquerez.`

---

## [8] Clôture

- **Rôle :** refermer l'expérience avec émotion.
- **Visuel :** retour à une vue de la mairie / ciel d'automne assombri ; monogramme ; feuillages.
- **Animation :** fondu lent, signature en `--font-script` qui se révèle.
- **Copy :**
  - `À très bientôt à Dunkerque,`
  - `[PRENOM_A] & [PRENOM_B]` *(signature)*
  - Pied de page discret : `Hôtel de Ville de Dunkerque · [DATE_MARIAGE]` + contact `[CONTACT]`

---

## Notes transverses

- **Header :** pas de menu classique. Au plus, un logo/monogramme discret et un bouton « Répondre » flottant qui apparaît après la section [3].
- **Langue :** français (bilingue à confirmer — cf. [wedding-brief.md](./wedding-brief.md)).
- **SEO :** `noindex` (invitation privée).
- **Tous les `[…]`** doivent être remplacés par les vraies infos avant mise en ligne.
