# RSVP Rules — Mariage Dunkerque

Règles de fonctionnement du **RSVP** (réponse des invités) et des **deux variantes d'invitation**. Proposition de départ — à valider avant build.

---

## 1. Les deux variantes

Un **seul site**, deux **expériences de programme** sélectionnées par lien personnalisé. Le décor cinématographique (mairie + scroll) est **identique** ; seules changent les sections « programme » et le formulaire RSVP.

| | **Variante A — Journée complète** | **Variante B — Soirée** |
|---|---|---|
| Public | Proches invités à toute la journée | Invités au vin d'honneur / à la soirée uniquement |
| Programme affiché | Cérémonie/mairie → vin d'honneur → dîner → soirée | Vin d'honneur / soirée uniquement |
| Champ « repas / dîner » | Affiché (présence dîner, menu, régime) | Masqué |
| Sélecteur d'URL | `?invitation=jour` | `?invitation=soir` |

> Implémentation : un paramètre d'URL (ou un slug par invité) charge le bon jeu de contenu. Pas de duplication de site. Valeur par défaut si paramètre absent : **à décider** (proposition : afficher la variante A, ou un message générique).

---

## 2. Champs du formulaire RSVP

### Champs communs (A & B)
- **Nom(s) de l'invité / du foyer** — texte, requis.
- **Réponse** — *Présent(e)* / *Absent(e)* — requis.
- **Nombre de personnes** — entier (selon le nombre d'invités sur le carton) — requis si présent.
- **Email** (et/ou téléphone) — pour confirmation/rappels — requis.
- **Message aux mariés** — texte libre, optionnel.

### Champs spécifiques Variante A (journée)
- **Présence au dîner** — oui/non.
- **Régime alimentaire / allergies** — texte, optionnel.
- **Présence enfants** — nombre + âges (pour menu enfant), optionnel.

### Champs optionnels (à confirmer si on les inclut)
- **Besoin d'hébergement / covoiturage** — case à cocher.
- **Chanson à ajouter à la playlist** — texte.

---

## 3. Règles de validation

- Réponse + nom + email obligatoires pour valider.
- Si *Absent(e)* → on masque les champs liés à la présence (nombre, dîner, régime) ; on garde le message.
- Nombre de personnes ≤ nombre autorisé sur l'invitation (si on gère un quota par invité).
- Anti-spam léger (honeypot ou question simple) plutôt qu'un CAPTCHA intrusif.
- Date limite : au-delà de `[DATE_LIMITE_RSVP]`, le formulaire affiche un message « les réponses sont closes, contactez-nous » (formulaire désactivé mais infos toujours visibles).

---

## 4. Où vont les réponses ? (backend — à décider)

Le RSVP a besoin d'un endroit où stocker les réponses **et** notifier les mariés. Options, par ordre de simplicité :

1. **Service de formulaire hébergé** (ex. Formspree / Tally / Google Forms embarqué) — zéro backend, rapide à mettre en place.
2. **Google Sheet via endpoint** (Apps Script) — données dans un tableur que les mariés consultent.
3. **Petit backend dédié** (Hetzner VPS, conforme à la stack habituelle) + base légère — plus de contrôle, plus de travail.
4. **Airtable / Notion via API** — joli suivi + tableau de bord.

> Suivi RSVP = objectif clé du projet (cf. mémoire projet). Le choix sera fait selon : confidentialité souhaitée, budget, et confort des mariés pour consulter les réponses. **À trancher avant le build du formulaire.**

Quelle que soit l'option : **notification email** aux mariés à chaque réponse, et **export** possible (CSV) de la liste.

---

## 5. Confidentialité

- Le site n'est **pas indexé** par les moteurs (`noindex`) — c'est une invitation privée.
- Lien partagé directement aux invités (pas de page publique listant les invités).
- Données personnelles (emails, régimes) : stockage minimal, accès réservé aux mariés, suppression après l'événement.
- Pas de tracking publicitaire / analytics tiers intrusifs.

---

## 6. États & messages

| État | Message à l'invité |
|---|---|
| Avant envoi | CTA clair : « Je réponds » |
| Réponse *présent* envoyée | « Merci, nous avons hâte de vous voir ! » + récap |
| Réponse *absent* envoyée | « Merci de nous avoir prévenus, vous nous manquerez. » |
| Modifier sa réponse | Permettre de renvoyer le formulaire (écrase la précédente via email/identifiant) |
| Après date limite | « Les réponses sont closes — écrivez-nous à `[CONTACT]`. » |

---

## 7. À confirmer avant build

- Variante par défaut si l'URL n'a pas de paramètre.
- Gestion d'un **quota de personnes par invité** (oui/non).
- Backend retenu (§4).
- Champs optionnels à conserver (hébergement, playlist, enfants).
- Possibilité pour l'invité de **modifier** sa réponse après coup.
