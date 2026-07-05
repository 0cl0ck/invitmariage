import { useLang, useDict } from "../i18n/LanguageContext.jsx";

// Petit sélecteur FR / ES pour la barre du haut.
export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  const { ui } = useDict();
  const names = { fr: ui.lang.frName, es: ui.lang.esName };

  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label={ui.lang.choose}
    >
      {["fr", "es"].map((code) => (
        <button
          key={code}
          type="button"
          className={"lang-toggle__btn" + (lang === code ? " is-active" : "")}
          aria-pressed={lang === code}
          aria-label={names[code]}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
