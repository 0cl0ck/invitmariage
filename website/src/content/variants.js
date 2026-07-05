// ---------------------------------------------------------------------------
// Source de vérité de la copy de l'invitation — bilingue FR / ES.
// Infos confirmées par les mariés (2026-06-29). Les rares champs encore
// incertains sont marqués « à confirmer ».
//
// Structure : `dict[lang]` expose { htmlLang, locale, wedding, variants, ui }.
// - `wedding`  : infos du couple (certaines invariantes, d'autres localisées).
// - `variants` : { ceremonie, vinDhonneur } — la copy propre à chaque variante.
// - `ui`       : tous les libellés d'interface (boutons, formulaires, erreurs…).
//
// ⚠️ Les noms de lieux (`place`) restent identiques dans les deux langues :
//    ce sont des noms propres/adresses, et l'URL Google Maps se construit
//    directement à partir de cette chaîne (cf. lib/maps.js).
// ---------------------------------------------------------------------------

// -- Invariants (identiques dans toutes les langues) ------------------------
const couple = "Hugo & Laura";
const monogram = "H ✦ L";
const city = "Dunkerque";
const contactEmails = ["hugodewas@gmail.com", "laura.arenas.n@gmail.com"];

// Lieux (noms propres — non traduits, cf. remarque en tête de fichier).
const PLACE_MAIRIE = "Hôtel de Ville de Dunkerque";
const PLACE_RECEPTION = "Princess Elizabeth";
const PLACE_TEMPLE = "Temple protestant de Dunkerque";

// ===========================================================================
//                               FRANÇAIS
// ===========================================================================
const weddingFr = {
  couple,
  monogram,
  city,
  contactEmails,
  season: "Automne 2026",
  dateLong: "Samedi 10 octobre 2026",
  rsvpDeadline: "10 août 2026",
};

const carpoolInfoFr = {
  h: "Accès & covoiturage",
  p: [
    "Stationnement possible aux abords du centre-ville de Dunkerque.",
    "Pas de voiture, ou des places à partager ?",
    "Rendez-vous sur le tableau de covoiturage ci-dessous : proposez un trajet, ou trouvez-en un, directement entre invités.",
  ],
};

const dressCodeInfoFr = {
  h: "Tenue",
  p: [
    "Pas de tenue blanche.",
    "Les tons automnaux sont les bienvenus, sans obligation.",
  ],
};

const ceremonieFr = {
  slug: "ceremonie",
  navLabel: "Cérémonie",
  opening: {
    kicker: `${city} · ${weddingFr.season}`,
    title: couple,
    subtitle: "Nous nous marions",
    hint: "Faites défiler",
  },
  card: {
    kicker: "Avec joie",
    names: couple,
    intro: "Nous avons le bonheur de vous convier à célébrer notre mariage",
    dateLong: weddingFr.dateLong,
    place: PLACE_MAIRIE,
    footnote: ["Cérémonie", "Réception", "Vin d'honneur"],
  },
  program: {
    kicker: "Programme",
    title: "Le déroulé du jour",
    steps: [
      { time: "10h45", name: "Accueil des invités", place: PLACE_MAIRIE },
      { time: "11h00", name: "Cérémonie civile", place: PLACE_MAIRIE },
      { time: "12h30", name: "Réception", place: PLACE_RECEPTION },
      { time: "16h30", name: "Célébration à l'église", place: PLACE_TEMPLE },
      { time: "17h45", name: "Vin d'honneur", place: PLACE_TEMPLE },
    ],
  },
  info: {
    kicker: "Infos pratiques",
    title: "Pour préparer votre venue",
    blocks: [carpoolInfoFr, dressCodeInfoFr],
  },
  rsvp: {
    kicker: "Votre réponse",
    title: "Serez-vous des nôtres ?",
    intro: `Merci de nous répondre avant le ${weddingFr.rsvpDeadline}.`,
    askDietary: true,
    askChildren: true,
  },
  closing: {
    line: "À très bientôt à Dunkerque,",
    signature: couple,
  },
};

const vinDhonneurFr = {
  slug: "vin-dhonneur",
  navLabel: "Vin d'honneur",
  opening: {
    kicker: `${city} · ${weddingFr.season}`,
    title: couple,
    subtitle: "Nous fêtons notre mariage",
    hint: "Faites défiler",
  },
  card: {
    kicker: "Avec joie",
    names: couple,
    intro:
      "Nous avons le plaisir de vous convier à la célébration de notre mariage à l'église, suivie du vin d'honneur",
    dateLong: weddingFr.dateLong,
    place: PLACE_TEMPLE,
    footnote: ["Célébration à l'église", "Vin d'honneur"],
  },
  program: {
    kicker: "Programme",
    title: "Le déroulé",
    steps: [
      { time: "16h30", name: "Célébration à l'église", place: PLACE_TEMPLE },
      { time: "17h45", name: "Vin d'honneur", place: PLACE_TEMPLE },
    ],
  },
  info: {
    kicker: "Infos pratiques",
    title: "Pour préparer votre venue",
    blocks: [carpoolInfoFr, dressCodeInfoFr],
  },
  rsvp: {
    kicker: "Votre réponse",
    title: "Serez-vous des nôtres ?",
    intro: `Merci de nous répondre avant le ${weddingFr.rsvpDeadline}.`,
    askDietary: false,
    askChildren: false,
  },
  closing: {
    line: "À très bientôt à Dunkerque,",
    signature: couple,
  },
};

const uiFr = {
  topbar: { respond: "Répondre" },
  hero: { continue: "Continuer" },
  stepper: { decrease: "Diminuer", increase: "Augmenter" },
  map: {
    label: "Itinéraire",
    aria: (place) => `Itinéraire vers ${place} (Google Maps)`,
  },
  lang: { choose: "Choisir la langue", frName: "Français", esName: "Español" },
  rsvp: {
    honeypot: "Ne pas remplir",
    nameLabel: "Votre nom (ou celui du foyer)*",
    emailLabel: "Email*",
    attendingLegend: "Serez-vous présent(e) ?*",
    attendingYes: "Avec plaisir",
    attendingNo: "Malheureusement non",
    guestsLabel: "Nombre de personnes (vous inclus)",
    childrenLabel: "Dont enfants",
    dietaryLabel: "Régime alimentaire / allergies",
    dietaryPlaceholder: "Optionnel",
    messageLabel: "Un mot pour les mariés (optionnel)",
    submitSending: "Envoi…",
    submitUpdate: "Mettre à jour ma réponse",
    submitSend: "J'envoie ma réponse",
    errorRequired: "Merci de renseigner votre nom, votre email et votre réponse.",
    errorSubmit: "Une erreur est survenue à l'envoi. Merci de réessayer.",
    correction:
      "Vous avez déjà répondu — vous pouvez modifier votre réponse ci-dessous.",
    thanksKicker: "Merci",
    thanksUpdated: "Votre réponse a bien été mise à jour.",
    thanksYes: "Merci, nous avons hâte de vous voir !",
    thanksNo: "Merci de nous avoir prévenus, vous nous manquerez.",
    contactBefore: "Une question ? Écrivez-nous à ",
    emailSep: " ou ",
    editAnswer: "Modifier ma réponse",
  },
  carpool: {
    kicker: "Entraide",
    title: "Covoiturage",
    intro:
      "Organisez-vous entre invités : proposez des places ou trouvez un trajet.",
    demo:
      "Mode démo (local à cet appareil) — la base partagée sera activée à la configuration de Supabase.",
    publishCta: "+ Publier une annonce",
    honeypot: "Ne pas remplir",
    typeLegend: "Type d'annonce",
    typeOffer: "Je propose des places",
    typeSeek: "Je cherche une place",
    nameLabel: "Prénom*",
    areaLabel: "Secteur de départ*",
    areaPlaceholder: "Ville / quartier",
    seatsLabel: "Places disponibles",
    contactLabel: "Contact* (téléphone ou email)",
    contactPlaceholder: "Visible par les invités",
    noteLabel: "Précisions (optionnel)",
    submitPublishing: "Publication…",
    submitPublish: "Publier",
    cancel: "Annuler",
    errorRequired:
      "Merci d'indiquer un prénom, un secteur de départ et un contact.",
    errorSubmit: "Une erreur est survenue. Merci de réessayer.",
    errorDelete: "La suppression a échoué. Merci de réessayer.",
    errorLoad: "Le tableau n'a pas pu être chargé. Réessayez plus tard.",
    colOffer: "Je propose",
    colOfferEmpty: "Aucune place proposée pour l'instant.",
    colSeek: "Je cherche",
    colSeekEmpty: "Personne ne cherche de place pour l'instant.",
    departure: "Départ : ",
    seats: (n) => `${n} place${n > 1 ? "s" : ""}`,
    confirmDelete: "Supprimer cette annonce ?",
    yes: "Oui",
    delete: "Supprimer",
  },
};

// ===========================================================================
//                               ESPAÑOL
// ===========================================================================
const weddingEs = {
  couple,
  monogram,
  city,
  contactEmails,
  season: "Otoño 2026",
  dateLong: "Sábado 10 de octubre de 2026",
  rsvpDeadline: "10 de agosto de 2026",
};

const carpoolInfoEs = {
  h: "Acceso y transporte compartido",
  p: [
    "Se puede parquear en los alrededores del centro de Dunkerque.",
    "¿Sin carro, o con cupos para compartir?",
    "Consulta la cartelera de transporte compartido más abajo: ofrece un trayecto o encuentra uno, directamente entre invitados.",
  ],
};

const dressCodeInfoEs = {
  h: "Vestimenta",
  p: [
    "Por favor, evita el blanco.",
    "Los tonos otoñales son bienvenidos, aunque no son obligatorios.",
  ],
};

const ceremonieEs = {
  slug: "ceremonie",
  navLabel: "Ceremonia",
  opening: {
    kicker: `${city} · ${weddingEs.season}`,
    title: couple,
    subtitle: "Nos casamos",
    hint: "Desliza",
  },
  card: {
    kicker: "¡Nos casamos!",
    names: couple,
    intro: "Tenemos la dicha de invitarte a celebrar nuestra boda",
    dateLong: weddingEs.dateLong,
    place: PLACE_MAIRIE,
    footnote: ["Ceremonia", "Recepción", "Vino de honor"],
  },
  program: {
    kicker: "Programa",
    title: "El desarrollo del día",
    steps: [
      { time: "10:45", name: "Bienvenida a los invitados", place: PLACE_MAIRIE },
      { time: "11:00", name: "Ceremonia civil", place: PLACE_MAIRIE },
      { time: "12:30", name: "Recepción", place: PLACE_RECEPTION },
      { time: "16:30", name: "Celebración en la iglesia", place: PLACE_TEMPLE },
      { time: "17:45", name: "Vino de honor", place: PLACE_TEMPLE },
    ],
  },
  info: {
    kicker: "Información práctica",
    title: "Para organizar tu llegada",
    blocks: [carpoolInfoEs, dressCodeInfoEs],
  },
  rsvp: {
    kicker: "Tu respuesta",
    title: "¿Nos acompañarás?",
    intro: `Por favor, responde antes del ${weddingEs.rsvpDeadline}.`,
    askDietary: true,
    askChildren: true,
  },
  closing: {
    line: "¡Hasta muy pronto en Dunkerque!",
    signature: couple,
  },
};

const vinDhonneurEs = {
  slug: "vin-dhonneur",
  navLabel: "Vino de honor",
  opening: {
    kicker: `${city} · ${weddingEs.season}`,
    title: couple,
    subtitle: "Celebramos nuestra boda",
    hint: "Desliza",
  },
  card: {
    kicker: "¡Nos casamos!",
    names: couple,
    intro:
      "Tenemos el placer de invitarte a la celebración de nuestra boda en la iglesia, seguida del vino de honor",
    dateLong: weddingEs.dateLong,
    place: PLACE_TEMPLE,
    footnote: ["Celebración en la iglesia", "Vino de honor"],
  },
  program: {
    kicker: "Programa",
    title: "El desarrollo",
    steps: [
      { time: "16:30", name: "Celebración en la iglesia", place: PLACE_TEMPLE },
      { time: "17:45", name: "Vino de honor", place: PLACE_TEMPLE },
    ],
  },
  info: {
    kicker: "Información práctica",
    title: "Para organizar tu llegada",
    blocks: [carpoolInfoEs, dressCodeInfoEs],
  },
  rsvp: {
    kicker: "Tu respuesta",
    title: "¿Nos acompañarás?",
    intro: `Por favor, responde antes del ${weddingEs.rsvpDeadline}.`,
    askDietary: false,
    askChildren: false,
  },
  closing: {
    line: "¡Hasta muy pronto en Dunkerque!",
    signature: couple,
  },
};

const uiEs = {
  topbar: { respond: "Responder" },
  hero: { continue: "Continuar" },
  stepper: { decrease: "Disminuir", increase: "Aumentar" },
  map: {
    label: "Cómo llegar",
    aria: (place) => `Cómo llegar a ${place} (Google Maps)`,
  },
  lang: { choose: "Elegir idioma", frName: "Français", esName: "Español" },
  rsvp: {
    honeypot: "No llenar",
    nameLabel: "Tu nombre (o el de tu familia)*",
    emailLabel: "Correo*",
    attendingLegend: "¿Podrás asistir?*",
    attendingYes: "Con mucho gusto",
    attendingNo: "Lamentablemente no",
    guestsLabel: "Número de personas (tú incluido/a)",
    childrenLabel: "Niños incluidos",
    dietaryLabel: "Restricciones alimentarias / alergias",
    dietaryPlaceholder: "Opcional",
    messageLabel: "Unas palabras para los novios (opcional)",
    submitSending: "Enviando…",
    submitUpdate: "Actualizar mi respuesta",
    submitSend: "Enviar mi respuesta",
    errorRequired: "Por favor, indica tu nombre, tu correo y tu respuesta.",
    errorSubmit:
      "Ocurrió un error al enviar. Inténtalo de nuevo, por favor.",
    correction:
      "Ya respondiste; puedes modificar tu respuesta a continuación.",
    thanksKicker: "Gracias",
    thanksUpdated: "Tu respuesta se actualizó correctamente.",
    thanksYes: "¡Gracias, tenemos muchas ganas de verte!",
    thanksNo: "Gracias por avisarnos, te vamos a extrañar.",
    contactBefore: "¿Alguna pregunta? Escríbenos a ",
    emailSep: " o ",
    editAnswer: "Modificar mi respuesta",
  },
  carpool: {
    kicker: "Ayuda mutua",
    title: "Transporte compartido",
    intro:
      "Coordínate con los demás invitados: ofrece cupos o encuentra un trayecto.",
    demo:
      "Modo demo (local en este dispositivo): la base compartida se activará al configurar Supabase.",
    publishCta: "+ Publicar un anuncio",
    honeypot: "No llenar",
    typeLegend: "Tipo de anuncio",
    typeOffer: "Ofrezco cupos",
    typeSeek: "Busco un cupo",
    nameLabel: "Nombre*",
    areaLabel: "Zona de salida*",
    areaPlaceholder: "Ciudad / barrio",
    seatsLabel: "Cupos disponibles",
    contactLabel: "Contacto* (teléfono o correo)",
    contactPlaceholder: "Visible para los invitados",
    noteLabel: "Detalles (opcional)",
    submitPublishing: "Publicando…",
    submitPublish: "Publicar",
    cancel: "Cancelar",
    errorRequired: "Por favor, indica un nombre, una zona de salida y un contacto.",
    errorSubmit: "Ocurrió un error. Inténtalo de nuevo, por favor.",
    errorDelete: "No se pudo eliminar. Inténtalo de nuevo, por favor.",
    errorLoad: "No se pudo cargar la cartelera. Inténtalo más tarde.",
    colOffer: "Ofrezco",
    colOfferEmpty: "Todavía no hay cupos ofrecidos.",
    colSeek: "Busco",
    colSeekEmpty: "Nadie busca cupo por ahora.",
    departure: "Salida: ",
    seats: (n) => `${n} cupo${n > 1 ? "s" : ""}`,
    confirmDelete: "¿Eliminar este anuncio?",
    yes: "Sí",
    delete: "Eliminar",
  },
};

// ===========================================================================
//                              DICTIONNAIRE
// ===========================================================================
export const dict = {
  fr: {
    htmlLang: "fr",
    locale: "fr-FR",
    wedding: weddingFr,
    variants: { ceremonie: ceremonieFr, vinDhonneur: vinDhonneurFr },
    ui: uiFr,
  },
  es: {
    htmlLang: "es",
    locale: "es-ES",
    wedding: weddingEs,
    variants: { ceremonie: ceremonieEs, vinDhonneur: vinDhonneurEs },
    ui: uiEs,
  },
};

export const LANGS = ["fr", "es"];
export const DEFAULT_LANG = "fr";

// Exports rétro-compatibles (page privée des mariés, en français uniquement).
export const wedding = dict.fr.wedding;
export const variants = dict.fr.variants;
