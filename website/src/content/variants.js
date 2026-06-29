// ---------------------------------------------------------------------------
// Source de vérité de la copy de l'invitation.
// Infos confirmées par les mariés (2026-06-29). Les rares champs encore
// incertains sont marqués « à confirmer ».
// ---------------------------------------------------------------------------

export const wedding = {
  couple: "Hugo & Laura",
  monogram: "H ✦ L",
  city: "Dunkerque",
  season: "Automne 2026",
  dateLong: "Samedi 10 octobre 2026",
  rsvpDeadline: "[ date limite à confirmer ]",
  contactEmails: ["hugodewas@gmail.com", "laura.arenas.n@gmail.com"],
};

// Bloc d'info covoiturage partagé par les deux variantes.
// Les blocs d'info acceptent `p` en chaîne OU en tableau de lignes (paragraphes).
const carpoolInfo = {
  h: "Accès & covoiturage",
  p: [
    "Stationnement possible aux abords du centre-ville de Dunkerque.",
    "Pas de voiture, ou des places à partager ?",
    "Rendez-vous sur le tableau de covoiturage ci-dessous : proposez un trajet, ou trouvez-en un, directement entre invités.",
  ],
};

const dressCodeInfo = {
  h: "Tenue",
  p: [
    "Pas de tenue blanche.",
    "Les tons automnaux sont les bienvenus, sans obligation.",
  ],
};

// =====================  VARIANTE « CÉRÉMONIE » (journée complète)  ===========
// Inclut : mairie (cérémonie civile), cérémonie religieuse, vin d'honneur.
const ceremonie = {
  slug: "ceremonie",
  navLabel: "Cérémonie",

  opening: {
    kicker: `${wedding.city} · ${wedding.season}`,
    title: wedding.couple,
    subtitle: "Nous nous marions",
    hint: "Faites défiler",
  },

  card: {
    kicker: "Avec joie",
    names: wedding.couple,
    intro: "Nous avons le bonheur de vous convier à célébrer notre mariage",
    dateLong: wedding.dateLong,
    place: "Hôtel de Ville de Dunkerque",
    footnote: "Cérémonie · Réception · Vin d'honneur",
  },

  program: {
    kicker: "Programme",
    title: "Le déroulé du jour",
    steps: [
      {
        time: "10h45",
        name: "Accueil des invités",
        place: "Hôtel de Ville de Dunkerque",
      },
      {
        time: "11h00",
        name: "Cérémonie civile",
        place: "Hôtel de Ville de Dunkerque",
      },
      {
        time: "12h30",
        name: "Réception",
        place: "Le Princess Elizabeth",
      },
      {
        time: "16h30",
        name: "Cérémonie religieuse",
        place: "Temple protestant de Dunkerque · quai aux Bois",
      },
      {
        time: "17h45",
        name: "Vin d'honneur",
        place: "Temple protestant de Dunkerque · quai aux Bois",
      },
    ],
  },

  info: {
    kicker: "Infos pratiques",
    title: "Pour préparer votre venue",
    blocks: [carpoolInfo, dressCodeInfo],
  },

  rsvp: {
    kicker: "Votre réponse",
    title: "Serez-vous des nôtres ?",
    intro: `Merci de nous répondre avant le ${wedding.rsvpDeadline}.`,
    askDietary: true,
    askChildren: true,
  },

  closing: {
    line: "À très bientôt à Dunkerque,",
    signature: wedding.couple,
  },
};

// =====================  VARIANTE « VIN D'HONNEUR »  =========================
// Invités à la CÉRÉMONIE RELIGIEUSE + au VIN D'HONNEUR (pas la mairie, pas le repas).
// ⚠️ Ne PAS mentionner la cérémonie civile / « mairie » ni la réception
//    (« Réception », « Princess Elizabeth ») pour ces invités.
const vinDhonneur = {
  slug: "vin-dhonneur",
  navLabel: "Vin d'honneur",

  opening: {
    kicker: `${wedding.city} · ${wedding.season}`,
    title: wedding.couple,
    subtitle: "Nous fêtons notre mariage",
    hint: "Faites défiler",
  },

  card: {
    kicker: "Avec joie",
    names: wedding.couple,
    intro: "Nous avons le plaisir de vous convier à notre cérémonie religieuse, suivie du vin d'honneur",
    dateLong: wedding.dateLong,
    place: "Temple protestant de Dunkerque",
    footnote: "Cérémonie religieuse · Vin d'honneur",
  },

  program: {
    kicker: "Programme",
    title: "Le déroulé",
    steps: [
      {
        time: "16h30",
        name: "Cérémonie religieuse",
        place: "Temple protestant de Dunkerque · quai aux Bois",
      },
      {
        time: "17h45",
        name: "Vin d'honneur",
        place: "Temple protestant de Dunkerque · quai aux Bois",
      },
    ],
  },

  info: {
    kicker: "Infos pratiques",
    title: "Pour préparer votre venue",
    blocks: [carpoolInfo, dressCodeInfo],
  },

  rsvp: {
    kicker: "Votre réponse",
    title: "Serez-vous des nôtres ?",
    intro: `Merci de nous répondre avant le ${wedding.rsvpDeadline}.`,
    askDietary: false,
    askChildren: false,
  },

  closing: {
    line: "À très bientôt à Dunkerque,",
    signature: wedding.couple,
  },
};

export const variants = { ceremonie, vinDhonneur };
