// ---------------------------------------------------------------------------
// Contenu de la checklist des mariés (espace privé, français uniquement).
// - ASSIGNEES : qui s'occupe d'une tâche.
// - TEMPLATE  : liste type, chargeable en un clic puis modifiable à souhait.
//
// Échéances de la liste type : `due` = nombre de jours AVANT le mariage
// (négatif = après), `dueDate` = date ISO fixe. Les dates sont calculées à
// partir de `wedding.dateIso` (cf. content/variants.js) au moment du chargement.
// ---------------------------------------------------------------------------
import { wedding } from "./variants.js";

export const DEFAULT_CATEGORY = "Divers";

export const ASSIGNEES = [
  { value: "hugo", label: "Hugo" },
  { value: "laura", label: "Laura" },
  { value: "both", label: "Hugo & Laura" },
];

export function assigneeLabel(value) {
  return ASSIGNEES.find((a) => a.value === value)?.label || "";
}

const CAT = {
  admin: "Administratif & légal",
  ceremonies: "Cérémonies",
  reception: "Réception · Princess Elizabeth",
  outfits: "Tenues & beauté",
  guests: "Invités",
  vendors: "Prestataires",
  dday: "Jour J",
  honeymoon: "Voyage de noces",
  after: "Après le mariage",
};

// Catégories proposées dans le formulaire (en plus de celles déjà utilisées).
export const SUGGESTED_CATEGORIES = [...Object.values(CAT), DEFAULT_CATEGORY];

export const TEMPLATE = [
  // --- Administratif & légal --------------------------------------------
  {
    category: CAT.admin,
    title: "Dossier de mariage complet déposé à la mairie",
    notes: "Pièces d'identité, justificatifs de domicile, actes de naissance, informations des témoins.",
    due: 30,
  },
  {
    category: CAT.admin,
    title: "Témoins confirmés pour la mairie (2 minimum, 4 maximum) et leurs pièces d'identité récupérées",
    due: 30,
  },
  {
    category: CAT.admin,
    title: "Publication des bans affichée par la mairie (au moins 10 jours avant)",
    due: 12,
  },
  {
    category: CAT.admin,
    title: "Contrat de mariage signé chez le notaire (si régime choisi)",
    due: 15,
  },
  {
    category: CAT.admin,
    title: "Assurance annulation / responsabilité civile pour la réception vérifiée",
  },

  // --- Cérémonies -------------------------------------------------------
  {
    category: CAT.ceremonies,
    title: "Rendez-vous de préparation avec le pasteur du temple",
    due: 21,
    assignee: "both",
  },
  {
    category: CAT.ceremonies,
    title: "Textes, lectures et cantiques choisis pour le temple",
    due: 14,
  },
  {
    category: CAT.ceremonies,
    title: "Musique du temple réservée (organiste ou musiciens)",
    due: 21,
  },
  {
    category: CAT.ceremonies,
    title: "Horaire et déroulé validés avec la mairie",
    due: 14,
  },
  {
    category: CAT.ceremonies,
    title: "Alliances achetées, gravées et à la bonne taille",
    due: 21,
    assignee: "both",
  },
  {
    category: CAT.ceremonies,
    title: "Vœux écrits (chacun de son côté)",
    due: 7,
    assignee: "both",
  },
  {
    category: CAT.ceremonies,
    title: "Livrets de cérémonie imprimés",
    due: 5,
  },
  {
    category: CAT.ceremonies,
    title: "Sortie de cérémonie : pétales, bulles ou confettis achetés, et quelqu'un pour les distribuer",
    due: 7,
  },

  // --- Réception --------------------------------------------------------
  {
    category: CAT.reception,
    title: "Contrat signé et acompte versé au lieu de réception",
  },
  {
    category: CAT.reception,
    title: "Menu validé avec le traiteur",
    due: 21,
  },
  {
    category: CAT.reception,
    title: "Gâteau ou pièce montée commandé(e)",
    due: 21,
  },
  {
    category: CAT.reception,
    title: "Boissons commandées (vin, champagne, softs)",
    due: 14,
  },
  {
    category: CAT.reception,
    title: "Fleurs et décoration des tables commandées",
    due: 14,
  },
  {
    category: CAT.reception,
    title: "Nombre définitif de convives transmis au traiteur et au lieu",
    notes: "Reprendre le total « personnes attendues » de l'espace mariés (page Réponses).",
    due: 10,
  },
  {
    category: CAT.reception,
    title: "Régimes alimentaires et allergies transmis au traiteur",
    notes: "Colonne « Régime » de la page Réponses.",
    due: 10,
  },
  {
    category: CAT.reception,
    title: "Menu enfants et coin enfants prévus",
    due: 10,
  },
  {
    category: CAT.reception,
    title: "Horaires d'accès, livraisons et démontage validés avec le bateau",
    due: 7,
  },
  {
    category: CAT.reception,
    title: "DJ / musique : playlist et moments clés transmis",
    due: 7,
  },
  {
    category: CAT.reception,
    title: "Ouverture de bal : chanson choisie et répétée",
    due: 7,
    assignee: "both",
  },
  {
    category: CAT.reception,
    title: "Discours et animations : témoins briefés sur le timing",
    due: 7,
  },
  {
    category: CAT.reception,
    title: "Plan de table finalisé",
    due: 5,
  },
  {
    category: CAT.reception,
    title: "Marque-places et numéros de table imprimés",
    due: 3,
  },

  // --- Tenues & beauté --------------------------------------------------
  {
    category: CAT.outfits,
    title: "Essai coiffure",
    due: 21,
    assignee: "laura",
  },
  {
    category: CAT.outfits,
    title: "Essai maquillage",
    due: 21,
    assignee: "laura",
  },
  {
    category: CAT.outfits,
    title: "Coiffeur et maquilleuse réservés pour le matin du jour J",
    due: 21,
    assignee: "laura",
  },
  {
    category: CAT.outfits,
    title: "Robe : dernières retouches faites",
    due: 14,
    assignee: "laura",
  },
  {
    category: CAT.outfits,
    title: "Costume : retouches faites",
    due: 14,
    assignee: "hugo",
  },
  {
    category: CAT.outfits,
    title: "Chaussures achetées et portées quelques fois avant le jour J",
    due: 14,
    assignee: "both",
  },
  {
    category: CAT.outfits,
    title: "Accessoires réunis (voile, bijoux, boutons de manchette, cravate ou nœud papillon)",
    due: 14,
    assignee: "both",
  },
  {
    category: CAT.outfits,
    title: "Tenues des témoins et des enfants d'honneur coordonnées",
    due: 14,
  },
  {
    category: CAT.outfits,
    title: "Tenue du lendemain prévue",
    due: 7,
    assignee: "both",
  },
  {
    category: CAT.outfits,
    title: "Rendez-vous coiffeur",
    due: 3,
    assignee: "hugo",
  },
  {
    category: CAT.outfits,
    title: "Manucure",
    due: 2,
    assignee: "laura",
  },

  // --- Invités ----------------------------------------------------------
  {
    category: CAT.guests,
    title: "Lien de l'invitation envoyé à tous les invités",
  },
  {
    category: CAT.guests,
    title: "Liste de mariage ou cagnotte communiquée",
    due: 30,
  },
  {
    category: CAT.guests,
    title: "Hébergements suggérés partagés aux invités qui viennent de loin",
    due: 30,
  },
  {
    category: CAT.guests,
    title: "Relancer les invités sans réponse avant la date limite",
    notes: `Date limite de réponse : ${wedding.rsvpDeadline}.`,
    dueDate: wedding.rsvpDeadlineIso,
  },
  {
    category: CAT.guests,
    title: "Point RSVP : présents, absents, enfants (page Réponses)",
    due: 15,
    assignee: "both",
  },
  {
    category: CAT.guests,
    title: "Accueil des invités venant de loin organisé (transferts, hébergement, programme des jours autour)",
    due: 14,
  },
  {
    category: CAT.guests,
    title: "Table des enfants et baby-sitter éventuel(le)",
    due: 10,
  },
  {
    category: CAT.guests,
    title: "Cadeaux invités ou petits souvenirs préparés",
    due: 7,
  },
  {
    category: CAT.guests,
    title: "Numéros utiles et adresses exactes partagés (contact du jour, lieux)",
    due: 5,
  },

  // --- Prestataires -----------------------------------------------------
  {
    category: CAT.vendors,
    title: "Photographe : contrat signé et liste des photos souhaitées envoyée",
    due: 14,
  },
  {
    category: CAT.vendors,
    title: "Vidéaste : contrat signé et moments clés listés",
    due: 14,
  },
  {
    category: CAT.vendors,
    title: "Fleuriste : bouquet de la mariée, boutonnière et décoration commandés",
    due: 14,
  },
  {
    category: CAT.vendors,
    title: "Chaque prestataire confirmé (horaires, adresses, contact du jour)",
    due: 7,
  },
  {
    category: CAT.vendors,
    title: "Acomptes réglés et soldes préparés",
    due: 3,
  },
  {
    category: CAT.vendors,
    title: "Enveloppes prêtes pour les soldes et pourboires du jour J",
    due: 1,
  },

  // --- Jour J -----------------------------------------------------------
  {
    category: CAT.dday,
    title: "Planning minute par minute rédigé",
    due: 10,
    assignee: "both",
  },
  {
    category: CAT.dday,
    title: "Planning partagé aux témoins, à la famille et aux prestataires",
    due: 7,
  },
  {
    category: CAT.dday,
    title: "Un « responsable du jour » désigné (contact des prestataires)",
    due: 7,
  },
  {
    category: CAT.dday,
    title: "Transport des mariés organisé (mairie, temple, bateau)",
    due: 7,
  },
  {
    category: CAT.dday,
    title: "Covoiturages des invités vérifiés (tableau du site)",
    due: 5,
  },
  {
    category: CAT.dday,
    title: "Kit d'urgence préparé (couture, pansements, mouchoirs, antidouleurs, chargeur)",
    due: 2,
  },
  {
    category: CAT.dday,
    title: "Météo vérifiée : parapluies, plaid, plan B pour les photos",
    due: 2,
  },
  {
    category: CAT.dday,
    title: "Pièces d'identité des mariés et des témoins réunies",
    due: 1,
  },
  {
    category: CAT.dday,
    title: "Alliances confiées à la personne désignée",
    due: 1,
  },
  {
    category: CAT.dday,
    title: "Appareils photo, batteries et téléphones chargés",
    due: 1,
  },
  {
    category: CAT.dday,
    title: "Affaires du lendemain préparées (tenues, trousse, papiers)",
    due: 1,
    assignee: "both",
  },
  {
    category: CAT.dday,
    title: "Petit-déjeuner et en-cas prévus pendant la préparation",
    due: 1,
  },
  {
    category: CAT.dday,
    title: "Se coucher tôt la veille",
    due: 1,
    assignee: "both",
  },

  // --- Voyage de noces --------------------------------------------------
  {
    category: CAT.honeymoon,
    title: "Vols et hébergement réservés",
  },
  {
    category: CAT.honeymoon,
    title: "Passeports valides et visas vérifiés",
    due: 30,
    assignee: "both",
  },
  {
    category: CAT.honeymoon,
    title: "Assurance voyage souscrite",
    due: 14,
  },
  {
    category: CAT.honeymoon,
    title: "Valises préparées",
    due: 2,
    assignee: "both",
  },

  // --- Après le mariage -------------------------------------------------
  {
    category: CAT.after,
    title: "Retour des locations (tenues, décoration, matériel)",
    due: -7,
  },
  {
    category: CAT.after,
    title: "Derniers soldes des prestataires réglés",
    due: -7,
  },
  {
    category: CAT.after,
    title: "Nettoyage et conservation de la robe et du costume",
    due: -14,
  },
  {
    category: CAT.after,
    title: "Remerciements envoyés aux invités",
    due: -30,
    assignee: "both",
  },
  {
    category: CAT.after,
    title: "Démarches administratives (nom d'usage, sécurité sociale, impôts, banque, mutuelle)",
    due: -30,
  },
  {
    category: CAT.after,
    title: "Photos et vidéos récupérées et partagées",
    due: -45,
  },
  {
    category: CAT.after,
    title: "Site d'invitation archivé (export CSV des réponses)",
    due: -30,
  },
];
