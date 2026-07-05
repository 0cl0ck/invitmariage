import { createContext, useContext } from "react";
import { dict } from "../content/variants.js";

// ---------------------------------------------------------------------------
// Contexte de langue (FR / ES) + hooks d'accès.
// Le composant <LanguageProvider> vit dans LanguageProvider.jsx (séparation
// requise par react-refresh : un fichier ne mélange pas composant et hooks).
// ---------------------------------------------------------------------------

export const LanguageContext = createContext(null);

// Accès à { lang, setLang, langs }.
export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}

// Tranche du dictionnaire pour la langue courante : { wedding, variants, ui,… }.
export function useDict() {
  const { lang } = useLang();
  return dict[lang];
}
