# Higgsfield — Notes & Prompts (USAGE ENCADRÉ)

> ⚠️ **À LIRE EN PREMIER.** Ce fichier ne déclenche **aucune** génération. Higgsfield (ou toute IA générative) n'est utilisé **qu'après accord explicite** des mariés/du porteur de projet, et **jamais** pour créer l'Hôtel de Ville de Dunkerque.

---

## 0. Garde-fous absolus

1. **Aucune génération de la mairie de Dunkerque.** Façade, beffroi, architecture flamande, « bâtiment qui ressemble à » : **interdits**. Le bâtiment vient **uniquement** d'assets réels fournis (cf. [asset-plan.md](./asset-plan.md)).
2. **Pas de dépense de crédits** sans accord explicite et écrit pour une tâche précise.
3. Higgsfield, *si* autorisé un jour, est limité à des usages **génériques et secondaires** :
   - éléments décoratifs d'automne (feuilles, particules, brume, grain) **sans aucun bâtiment réel** ;
   - habillages abstraits de transition.
4. **Le héros visuel n'est jamais généré.** Le scrub d'approche se fait sur la **vidéo réelle**.
5. En cas de doute : **ne rien générer**, demander.

---

## 1. Ce que Higgsfield NE fera PAS (liste noire)

- ❌ « Hôtel de Ville de Dunkerque », « Dunkirk town hall », « mairie de Dunkerque », « beffroi de Dunkerque ».
- ❌ Tout bâtiment public flamand en brique rouge avec beffroi (équivalent déguisé).
- ❌ Place, parvis ou rue reconnaissables de Dunkerque.
- ❌ Reconstitution « plausible » du lieu réel sous quelque angle que ce soit.
- ❌ Visages des mariés ou des invités.

---

## 2. Ce que Higgsfield POURRAIT faire (uniquement après accord)

Usages **décoratifs génériques**, sans lieu ni personne réels :

- Boucle de **feuilles d'automne** qui tombent (fond transparent), pour overlay léger.
- **Brume / poussière dorée** flottante, abstraite.
- **Texture / grain** de papier animé très subtil.
- Transitions abstraites couleur automne (cuivre, ocre, bordeaux).

Ces éléments iraient dans `assets/decorative/` et resteraient **discrets** (cf. [design-system.md](./design-system.md)).

---

## 3. Gabarits de prompts (DÉCOR GÉNÉRIQUE UNIQUEMENT — à n'utiliser qu'après feu vert)

> Ces gabarits sont **en attente**. Ne pas exécuter sans accord explicite.

**A — Feuilles d'automne (overlay)**
```
Falling autumn leaves, maple and oak, warm copper / amber / burgundy tones,
soft golden-hour backlight, gentle slow motion, shallow depth of field,
TRANSPARENT / black background, no buildings, no people, no text, seamless loop.
```

**B — Brume dorée abstraite**
```
Abstract drifting golden mist and dust particles, warm autumn palette,
soft volumetric light, slow ethereal motion, no architecture, no landmarks,
no people, no text, seamless loop, subtle.
```

**C — Texture papier animée**
```
Subtle animated paper grain texture, warm cream tone, very low contrast,
slight fiber movement, no objects, no buildings, no text, seamless loop.
```

**Négatifs systématiques à ajouter :**
```
negative: town hall, city hall, mairie, belfry, beffroi, Dunkirk, Dunkerque,
red brick civic building, recognizable landmark, real place, faces, people,
logos, watermark, text.
```

---

## 4. Procédure d'autorisation

Avant toute génération Higgsfield :
1. Identifier précisément **l'élément générique** voulu (jamais la mairie).
2. Demander un **accord explicite** (« oui, génère l'overlay de feuilles ») + confirmation de l'usage des crédits.
3. Générer **un seul** essai, le valider, **puis** seulement itérer.
4. Ranger le résultat dans `assets/decorative/` et le documenter dans [asset-plan.md](./asset-plan.md).

> Tant que ce feu vert n'est pas donné, ce fichier reste purement documentaire.
