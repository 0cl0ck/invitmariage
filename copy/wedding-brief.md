# Wedding Brief — Mariage Dunkerque

> Fichier de cadrage. Tout ce qui est entre crochets `[…]` est un **placeholder à confirmer** par les mariés. Aucune information n'est inventée comme définitive.

---

## 1. Le concept en une phrase

Une invitation de mariage **cinématographique au défilement** : le visiteur arrive devant l'**Hôtel de Ville de Dunkerque** (photo réelle), puis le scroll le fait *avancer* vers le bâtiment via une vidéo scrubbée, jusqu'à ce que la caméra se stabilise sur la mairie et qu'un **faire-part raffiné** apparaisse au centre.

C'est un **faire-part**, pas un site institutionnel : peu de texte, beaucoup d'atmosphère, une seule action principale (RSVP).

---

## 2. Les mariés & l'événement (à confirmer)

| Champ | Valeur | Statut |
|---|---|---|
| Prénom A | `[PRENOM_A]` | à fournir |
| Prénom B | `[PRENOM_B]` | à fournir |
| Date du mariage | `[DATE_MARIAGE]` (mariage d'automne) | à fournir |
| Cérémonie civile | Hôtel de Ville de Dunkerque, `[ADRESSE_MAIRIE]` | lieu confirmé (mairie de Dunkerque), détails à fournir |
| Cérémonie religieuse / laïque | `[LIEU_CEREMONIE]` | optionnel, à confirmer |
| Vin d'honneur | `[LIEU_VIN_HONNEUR]` | à fournir |
| Réception / dîner | `[LIEU_RECEPTION]` | à fournir |
| Date limite RSVP | `[DATE_LIMITE_RSVP]` | à fournir |
| Contact organisateurs | `[CONTACT_EMAIL]` / `[CONTACT_TEL]` | à fournir |

> ⚠️ Tant que ces champs ne sont pas fournis, le site affiche des **placeholders neutres** clairement marqués.

---

## 3. Le lieu réel — règle absolue

L'**Hôtel de Ville de Dunkerque** (beffroi, façade flamande en brique rouge, architecture début XXᵉ) est le **héros visuel** du site.

**Il ne doit JAMAIS être généré, inventé, réinterprété, redessiné ou remplacé.**

- L'image d'ouverture = **photo réelle fournie par les mariés**.
- La vidéo d'approche = **séquence réelle** (drone / marche / dolly) fournie par les mariés, OU dérivée d'images réelles validées.
- Voir [asset-plan.md](./asset-plan.md) section « Règle anti-hallucination » pour le détail.

Tant que ces fichiers réels n'existent pas, le site utilise des **placeholders neutres** (aplats de couleur, cadre vide légendé « Hôtel de Ville de Dunkerque — visuel réel à venir »).

---

## 4. Ton & émotion recherchés

- **Haut de gamme, sobre, chaleureux.** Pas de clipart, pas de cœurs, pas de paillettes criardes.
- **Automne** : lumière dorée de fin de journée, feuillages cuivrés, brume légère, matières (papier texturé, dorure mate).
- **Cinématographique** : le scroll est une *caméra*, pas un menu. Le visiteur « entre dans la scène ».
- **Intime** : on s'adresse à un invité, à la deuxième personne, avec délicatesse.

Mots-clés de direction artistique : *cuivre, brume, beffroi, dorure mate, soir d'automne, élégance flamande, calme.*

---

## 5. Parcours du visiteur (résumé narratif)

1. **Ouverture** — Plein écran : photo fixe de l'Hôtel de Ville, légère vignette, titre discret qui apparaît.
2. **Approche** — Le scroll scrubbe une vidéo : on se rapproche du bâtiment, la lumière se réchauffe.
3. **Arrivée** — La caméra se centre sur la mairie ; le mouvement se fige.
4. **Le faire-part** — Une carte raffinée apparaît au centre (noms, date, lieu).
5. **Les détails** — Programme du jour, lieux, infos pratiques.
6. **RSVP** — Une seule action forte ; voir [rsvp-rules.md](./rsvp-rules.md).
7. **Clôture** — Remerciement, signature des mariés, ambiance d'automne.

Le détail section par section est dans [website-copy.md](./website-copy.md).

---

## 6. Les deux variantes d'invitation

Deux versions du faire-part partagent **le même décor cinématographique** mais diffèrent par le **programme affiché** et le **formulaire RSVP**. Voir détail dans [rsvp-rules.md](./rsvp-rules.md) et [website-copy.md](./website-copy.md).

- **Variante A — Journée complète** : invités présents du début (mairie / cérémonie) au soir (dîner + soirée).
- **Variante B — Soirée** : invités présents à partir du vin d'honneur / de la soirée uniquement.

Le choix de variante se fait par **paramètre d'URL** (ex. `?invitation=jour` / `?invitation=soir`) ou par lien personnalisé, sans dupliquer le site.

---

## 7. Contraintes techniques (rappel)

- Stack : **Vite + React + JavaScript**, **GSAP + ScrollTrigger**, **Lenis**, **variables CSS**.
- **Mobile-first** : l'expérience scroll doit rester fluide et lisible sur téléphone (la majorité des invités ouvriront le lien sur mobile).
- **Performance** : la vidéo scrubbée est l'élément le plus lourd → prévoir une version optimisée + fallback image (voir [asset-plan.md](./asset-plan.md)).
- **Accessibilité** : respect de `prefers-reduced-motion` (fallback non animé), contrastes suffisants.
- **Higgsfield MCP** : utilisable **uniquement après accord explicite** et **jamais** pour générer la mairie.

---

## 8. Ce qui n'est PAS encore décidé (questions ouvertes)

- Noms, date, adresses exactes, date limite RSVP.
- Y a-t-il une cérémonie religieuse/laïque en plus de la mairie ?
- Liste de cadeaux / cagnotte : à inclure ?
- Hébergements / covoiturage à suggérer ?
- Langue : français uniquement, ou bilingue ?
- Musique d'ambiance au scroll : souhaitée ou non ?

> Ces points seront tranchés avant la phase de build.
