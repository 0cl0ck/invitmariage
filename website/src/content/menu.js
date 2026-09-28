// ---------------------------------------------------------------------------
// Choix des menus (repas du 10 octobre 2026) : catalogue des plats + libellés
// FR / ES. Fichier JS pur (sans JSX) : importé aussi par les fonctions serveur
// de /api (validation, emails). Les codes (veau, carrelet…) sont ceux des
// contraintes CHECK de supabase/menus.sql : ne pas les renommer.
// ---------------------------------------------------------------------------

// Date limite (4 octobre) : affichée aux invités, pas bloquante, pour que
// les retardataires et les menus rouverts par les mariés restent possibles.
// Un gâteau par parfum, 20 parts chacun (cf. supabase/menus.sql).
export const CAKE_CAP = 20;

export const STARTERS = ["veau", "gaspacho"];
export const ADULT_MAINS = ["carrelet", "agneau", "burrata"];
export const CHILD_MAINS = ["poulet", "poisson"];
export const CAKES = ["chocolat", "fruits_rouges", "exotique"];

export const menuDict = {
  fr: {
    deadline: "dimanche 4 octobre",
    dishes: {
      veau: {
        name: "Noix de veau façon carpaccio",
        desc: "Juste cuite, confiture acidulée de tomate et balsamique, copeaux de parmesan et pignons grillés",
      },
      gaspacho: {
        name: "Gaspacho de petits pois",
        desc: "Émulsion mozzarella di bufala, julienne de pastrami et éclats de pistache",
      },
      carrelet: {
        name: "Carrelet entier rôti",
        desc: "Beurre noisette et herbes fraîches, légumes du moment et polenta grillée",
      },
      agneau: {
        name: "Roulé d'agneau grillé",
        desc: "Sauce à l'Anosteke et caramel d'épices douces, rattes du Touquet et légumes provençaux",
      },
      burrata: {
        name: "Burrata panée (végétarien)",
        desc: "Confiture acidulée de tomate et balsamique, légumes provençaux grillés, roquette et amandes effilées",
      },
      poulet: { name: "Filet de poulet et frites maison", desc: "Légumes du moment" },
      poisson: { name: "Poisson selon arrivage", desc: "Risotto et légumes du moment" },
      chocolat: { name: "Trois chocolats", desc: "" },
      fruits_rouges: { name: "Fruits rouges", desc: "" },
      exotique: { name: "Exotique", desc: "" },
    },
    ui: {
      docTitle: "Votre menu",
      kicker: "Samedi 10 octobre 2026",
      title: "Votre menu",
      intro: (name) => `Bonjour ${name}, choisissez le repas de chaque personne de votre foyer.`,
      introDeadline: (d) => `Merci de répondre avant le ${d}.`,
      lockNote: "Une fois confirmé, votre choix est définitif : nous le transmettons au restaurant.",
      adult: (n) => `Adulte ${n}`,
      child: (n) => `Enfant ${n}`,
      personName: "Prénom",
      personNamePh: "Prénom de la personne",
      starter: "Entrée",
      main: "Plat",
      childMain: "Menu enfant",
      cheese: "Assiette de fromages régionaux",
      cheeseYes: "Oui, avec plaisir",
      cheeseNo: "Non merci",
      cake: "Gâteau",
      cakeFull: "Complet",
      cakeLeft: (n) => (n === 1 ? "Dernière part" : `${n} parts restantes`),
      review: "Vérifier mes choix",
      back: "Modifier",
      confirm: "Je confirme",
      confirming: "Envoi…",
      reviewTitle: "Récapitulatif",
      reviewNote: "Tout est bon ? Après confirmation, vous ne pourrez plus changer.",
      errorIncomplete: "Il manque un choix ou un prénom (voir les champs en rouge).",
      errorCakeFull: (cake) => `Le gâteau « ${cake} » vient d'être complet. Merci d'en choisir un autre.`,
      errorGeneric: "L'envoi n'a pas fonctionné. Réessayez dans un instant, ou écrivez-nous.",
      doneKicker: "Merci !",
      doneTitle: "Votre menu est confirmé",
      doneEmail: (email) => `Un email de confirmation a été envoyé à ${email}.`,
      doneNoEmail: "Pensez à faire une capture de cet écran pour garder votre choix.",
      changeHelp: "Un changement indispensable ? Écrivez-nous : ",
      countHelp: "Le nombre de personnes n'est pas le bon ? Écrivez-nous : ",
      notFoundTitle: "Ce lien n'est pas valide",
      notFoundText: "Vérifiez que vous avez bien copié le lien en entier, ou écrivez-nous : ",
      loading: "Chargement…",
      or: " ou ",
      cheeseLine: (yes) => (yes ? "Fromages : oui" : "Fromages : non"),
      cakeLine: (name) => `Gâteau : ${name}`,
    },
  },
  es: {
    deadline: "domingo 4 de octubre",
    dishes: {
      veau: {
        name: "Carpaccio de nuez de ternera",
        desc: "Apenas cocida, mermelada ácida de tomate y balsámico, lascas de parmesano y piñones tostados",
      },
      gaspacho: {
        name: "Gazpacho de arvejas",
        desc: "Emulsión de mozzarella di bufala, juliana de pastrami y pistachos troceados",
      },
      carrelet: {
        name: "Platija entera asada",
        desc: "Mantequilla avellanada y hierbas frescas, verduras de temporada y polenta a la parrilla",
      },
      agneau: {
        name: "Rollo de cordero a la parrilla",
        desc: "Salsa Anosteke y caramelo de especias suaves, papas rattes de Le Touquet y verduras provenzales",
      },
      burrata: {
        name: "Burrata apanada (vegetariano)",
        desc: "Mermelada ácida de tomate y balsámico, verduras provenzales asadas, rúgula y almendras fileteadas",
      },
      poulet: { name: "Filete de pollo con papas fritas caseras", desc: "Verduras de temporada" },
      poisson: { name: "Pescado del día", desc: "Risotto y verduras de temporada" },
      chocolat: { name: "Tres chocolates", desc: "" },
      fruits_rouges: { name: "Frutos rojos", desc: "" },
      exotique: { name: "Exótico", desc: "" },
    },
    ui: {
      docTitle: "Su menú",
      kicker: "Sábado 10 de octubre de 2026",
      title: "Su menú",
      intro: (name) => `Hola ${name}, elijan la comida de cada persona de su familia.`,
      introDeadline: (d) => `Por favor respondan antes del ${d}.`,
      lockNote: "Una vez confirmada, su elección es definitiva: la enviamos al restaurante.",
      adult: (n) => `Adulto ${n}`,
      child: (n) => `Niño ${n}`,
      personName: "Nombre",
      personNamePh: "Nombre de la persona",
      starter: "Entrada",
      main: "Plato fuerte",
      childMain: "Menú infantil",
      cheese: "Tabla de quesos regionales",
      cheeseYes: "Sí, con gusto",
      cheeseNo: "No, gracias",
      cake: "Torta",
      cakeFull: "Agotada",
      cakeLeft: (n) => (n === 1 ? "Última porción" : `Quedan ${n} porciones`),
      review: "Revisar mi elección",
      back: "Modificar",
      confirm: "Confirmo",
      confirming: "Enviando…",
      reviewTitle: "Resumen",
      reviewNote: "¿Todo bien? Después de confirmar ya no podrán cambiar.",
      errorIncomplete: "Falta una elección o un nombre (ver los campos en rojo).",
      errorCakeFull: (cake) => `La torta « ${cake} » acaba de agotarse. Por favor elijan otra.`,
      errorGeneric: "El envío no funcionó. Intenten de nuevo en un momento, o escríbannos.",
      doneKicker: "¡Gracias!",
      doneTitle: "Su menú está confirmado",
      doneEmail: (email) => `Enviamos un correo de confirmación a ${email}.`,
      doneNoEmail: "Tomen una captura de esta pantalla para guardar su elección.",
      changeHelp: "¿Un cambio indispensable? Escríbannos: ",
      countHelp: "¿El número de personas no es correcto? Escríbannos: ",
      notFoundTitle: "Este enlace no es válido",
      notFoundText: "Verifiquen que copiaron el enlace completo, o escríbannos: ",
      loading: "Cargando…",
      or: " o ",
      cheeseLine: (yes) => (yes ? "Quesos: sí" : "Quesos: no"),
      cakeLine: (name) => `Torta: ${name}`,
    },
  },
};
