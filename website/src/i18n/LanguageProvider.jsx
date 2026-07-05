import { useEffect, useMemo, useState } from "react";
import { dict, LANGS, DEFAULT_LANG } from "../content/variants.js";
import { LanguageContext } from "./LanguageContext.jsx";

// ---------------------------------------------------------------------------
// Fournit la langue courante (FR / ES) à l'ensemble de l'invitation.
//
// - Aucune route dédiée : les URLs restent /ceremonie et /vin-dhonneur.
// - Choix initial (par priorité) :
//     1. paramètre d'URL ?lang=es  → lien partageable qui force la langue
//        (ex. envoyer directement l'invitation en espagnol) ;
//     2. préférence enregistrée (localStorage) ;
//     3. langue du navigateur ;
//     4. français par défaut.
// - Le choix est mémorisé (localStorage) et l'attribut <html lang> est mis à
//   jour pour l'accessibilité.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "invit-lang";

// Normalise une valeur de langue ("es-ES", "ES", "es"…) → "es" si gérée, sinon null.
function normalizeLang(value) {
  const base = String(value || "").slice(0, 2).toLowerCase();
  return LANGS.includes(base) ? base : null;
}

// Lit ?lang= dans l'URL courante (lien direct type ?lang=es).
function readLangParam() {
  try {
    return normalizeLang(new URLSearchParams(window.location.search).get("lang"));
  } catch {
    return null;
  }
}

function detectInitialLang() {
  if (typeof window === "undefined") return DEFAULT_LANG;

  // 1) Lien explicite ?lang=es — priorité maximale (intention de l'expéditeur).
  const fromUrl = readLangParam();
  if (fromUrl) return fromUrl;

  // 2) Préférence déjà enregistrée.
  const saved = window.localStorage?.getItem(STORAGE_KEY);
  if (saved && LANGS.includes(saved)) return saved;

  // 3) Première visite : on suit la langue du navigateur si on la gère.
  const nav = window.navigator?.languages || [window.navigator?.language];
  for (const tag of nav) {
    const base = normalizeLang(tag);
    if (base) return base;
  }

  // 4) Français par défaut.
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = (next) => {
    if (LANGS.includes(next)) setLangState(next);
  };

  // Reflète la langue courante sur <html lang> (a11y) et mémorise le choix —
  // y compris celui issu du lien ?lang=, pour qu'il « colle » à la navigation.
  useEffect(() => {
    document.documentElement.lang = dict[lang].htmlLang;
    try {
      window.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {
      /* localStorage indisponible (mode privé strict) — on ignore. */
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, langs: LANGS }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
