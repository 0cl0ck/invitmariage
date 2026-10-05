// Espace mariés : liste pour le restaurant (/espace-maries/restaurant)
// Une ligne par convive (prénom, entrée, plat, fromage, allergie), prénom et
// allergie corrigés ici par les mariés, fiche allergies pour la cuisine et le
// service, impression. Aide-mémoire : un picto par plat et ⚠️ pour une
// allergie, les mêmes sur la fiche et sur les marque-places. Le PDF n'affiche
// que les prénoms (pas de nom de foyer) ; la fiche allergies tient sur une page.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGate } from "./AdminShell.jsx";
import { Totals } from "./MenusAdminPage.jsx";
import { listHouseholds, updateChoice } from "../lib/menus.js";
import { listResponses, latestByEmail } from "../lib/rsvp.js";
import { menuDict, STARTERS, ADULT_MAINS, CHILD_MAINS } from "../content/menu.js";
import { wedding } from "../content/variants.js";

const { dishes } = menuDict.fr;

const PICTO = { veau: "🥩", gaspacho: "🥣", carrelet: "🐟", agneau: "🐑", burrata: "🌱", poulet: "🍗", poisson: "🐠" };
// Short names: one line per guest on the printed sheets (the legend has the full ones).
const SHORT = {
  veau: "Carpaccio de veau",
  gaspacho: "Gaspacho",
  carrelet: "Carrelet",
  agneau: "Agneau",
  burrata: "Burrata (végé)",
  poulet: "Poulet frites",
  poisson: "Poisson",
};

const LEGEND = [
  ...[...STARTERS, ...ADULT_MAINS].map((k) => [PICTO[k], dishes[k].name]),
  ...CHILD_MAINS.map((k) => [PICTO[k], `${dishes[k].name} (enfant)`]),
  ["✕", "Sans entrée / pas de menu enfant"],
  ["🧀", "Fromage"],
  ["⚠️", "Allergie"],
];

/** Emoji in a fixed-width box: the dish names line up from one row to the next. */
function Item({ icon, children }) {
  return (
    <span className="resto-item">
      <span className="resto-emoji" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </span>
  );
}

const Dish = ({ code, none }) => (code ? <Item icon={PICTO[code]}>{SHORT[code]}</Item> : <Item icon="✕">{none}</Item>);

/** Entrée, plat, fromage cells of one guest. */
function Courses({ g }) {
  const adult = g.kind === "adult";
  return (
    <>
      <td>{adult ? <Dish code={g.starter} none="Sans entrée" /> : "·"}</td>
      <td>
        <Dish code={g.main} none="Pas de menu" />
      </td>
      <td>{adult ? <Item icon={g.cheese ? "🧀" : ""}>{g.cheese ? "Oui" : "Non"}</Item> : "·"}</td>
    </>
  );
}

function RestaurantDashboard({ demo, onSignOut }) {
  const [households, setHouseholds] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState({}); // "guest key|field" → text being typed

  const load = useCallback(() => {
    return Promise.all([listHouseholds(), listResponses()])
      .then(([hs, rs]) => {
        setHouseholds(hs);
        setRsvps(rs);
      })
      .catch((e) => setError("Lecture impossible. " + (e?.message || "")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // One row per person with a confirmed menu, by household; the household's
  // RSVP diet text (as typed by the guests) is shown next to its first person.
  const guests = useMemo(() => {
    const byId = new Map(rsvps.map((r) => [r.id, r]));
    const latest = latestByEmail(rsvps);
    const rsvpOf = (h) =>
      byId.get(h.rsvp_id) || (h.email && latest.find((r) => (r.email || "").toLowerCase() === h.email.toLowerCase()));
    return households
      .filter((h) => h.confirmed_at && h.choices.length)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .flatMap((h) =>
        h.choices.map((c, i) => ({
          ...c,
          key: `${h.id}:${c.position}`,
          householdId: h.id,
          household: h.name,
          first: i === 0,
          rsvpDiet: i === 0 ? rsvpOf(h)?.dietary || "" : "",
        })),
      );
  }, [households, rsvps]);

  // What is typed counts at once (screen and print), even before it is saved.
  const draftOf = (g, field) => drafts[`${g.key}|${field}`];
  const valueOf = (g, field) => (draftOf(g, field) ?? g[field] ?? "").trim();
  const allergyOf = (g) => valueOf(g, "allergy");
  const nameOf = (g) => valueOf(g, "person_name") || g.person_name;

  const pending = households.filter((h) => !h.confirmed_at);
  const pendingPeople = pending.reduce((n, h) => n + h.adults + h.children, 0);
  const allergic = guests.filter(allergyOf);
  // Wrote something in the RSVP, but no allergy reported on anyone of the
  // household yet: a real allergy may be waiting (or it was a joke).
  const toCheck = guests.filter((g) => g.rsvpDiet && !guests.some((o) => o.householdId === g.householdId && allergyOf(o)));
  // The PDF shows first names only: two guests with the same one must be told apart.
  const byName = new Map();
  for (const g of guests) {
    const k = nameOf(g).toLowerCase();
    byName.set(k, [...(byName.get(k) || []), g]);
  }
  const duplicates = [...byName.values()].filter((list) => list.length > 1);
  // A space may hide a family name typed by the guest (« Paul Martin »).
  const multiWord = guests.filter((g) => /\s/.test(nameOf(g)));

  const print = () => {
    const warnings = [
      toCheck.length && `${toCheck.length} foyer(s) ont écrit un régime ou une allergie dans le RSVP, sans rien de reporté sur la liste.`,
      duplicates.length && `${duplicates.length} prénom(s) en double, impossibles à distinguer sur le PDF.`,
    ].filter(Boolean);
    if (warnings.length && !window.confirm(`${warnings.join("\n")}\nImprimer quand même ?`)) return;
    window.print();
  };

  const save = async (g, field) => {
    const id = `${g.key}|${field}`;
    if (!(id in drafts)) return;
    const value = drafts[id].trim();
    if (value !== (g[field] || "")) {
      setError("");
      try {
        await updateChoice(g, { [field]: value });
        await load();
        if (field === "person_name") setNotice(`Prénom corrigé : ${g.person_name} → ${value}.`);
        else setNotice(value ? `Allergie de ${g.person_name} enregistrée.` : `Allergie de ${g.person_name} effacée.`);
      } catch (e) {
        setError("Enregistrement impossible. " + (e?.message || ""));
        return; // keep what was typed
      }
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  };

  const field = (g, name, label, maxLength, placeholder) => (
    <input
      className={`resto-input resto-input--${name} resto-no-print`}
      type="text"
      maxLength={maxLength}
      value={draftOf(g, name) ?? g[name] ?? ""}
      placeholder={placeholder}
      aria-label={`${label} de ${g.person_name}`}
      onChange={(e) => setDrafts((d) => ({ ...d, [`${g.key}|${name}`]: e.target.value }))}
      onBlur={() => save(g, name)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );

  const printedOn = new Date().toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="resto">
      <div className="admin__bar resto-no-print">
        <div className="admin-stats">
          <span className="admin-stat"><strong>{guests.length}</strong> convives</span>
          <span className="admin-stat"><strong>{allergic.length}</strong> allergies</span>
          {pending.length > 0 && (
            <span className="admin-stat is-warning"><strong>{pending.length}</strong> foyers sans menu</span>
          )}
        </div>
        <div className="admin__actions">
          <button className="btn btn--gold" onClick={print} disabled={!guests.length}>
            Imprimer / PDF
          </button>
          <button className="btn btn--ghost" onClick={() => { setLoading(true); load(); }} disabled={loading}>
            {loading ? "…" : "Rafraîchir"}
          </button>
          {!demo && (
            <button className="btn btn--ghost" onClick={onSignOut}>
              Se déconnecter
            </button>
          )}
        </div>
      </div>

      {error && <p className="rsvp__error resto-no-print">{error}</p>}
      {notice && <p className="admin__notice resto-no-print">{notice}</p>}
      <p className="admin-panel__hint resto-no-print">
        Corrigez le prénom et l'allergie de chaque convive directement dans la liste (enregistré dès que vous quittez la case) ; la
        colonne RSVP rappelle ce que le foyer a écrit. « Imprimer / PDF » sort la fiche allergies (une page), puis les totaux et la
        liste complète, avec les prénoms seulement.
      </p>

      {toCheck.length > 0 && (
        <div className="admin-panel resto-no-print">
          <h3 className="admin-panel__title">À vérifier avant d'imprimer ({toCheck.length})</h3>
          <p className="admin-panel__hint">
            Ces foyers ont écrit quelque chose dans le RSVP, mais aucune allergie n'est reportée chez eux : reportez-la sur la
            bonne personne dans la liste, ou ignorez si c'est une blague.
          </p>
          <ul className="resto-check">
            {toCheck.map((g) => (
              <li key={g.key}>
                <strong>{g.household}</strong> : « {g.rsvpDiet} »
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="admin-panel resto-no-print">
          <h3 className="admin-panel__title">Prénoms en double ({duplicates.length})</h3>
          <p className="admin-panel__hint">
            Le PDF n'affiche que les prénoms : pour que la cuisine et le service ne les confondent pas, ajoutez une initiale (par
            exemple « Marie D. ») dans la colonne « Prénom ».
          </p>
          <ul className="resto-check">
            {duplicates.map((list) => (
              <li key={list[0].key}>
                <strong>{nameOf(list[0])}</strong> : {list.map((g) => g.household).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {multiWord.length > 0 && (
        <div className="admin-panel resto-no-print">
          <h3 className="admin-panel__title">Prénoms en plusieurs mots ({multiWord.length})</h3>
          <p className="admin-panel__hint">
            S'il y a un nom de famille, retirez-le dans la colonne « Prénom ». Un prénom composé (« Marie Claude ») peut rester.
          </p>
          <ul className="resto-check">
            {multiWord.map((g) => (
              <li key={g.key}>
                <strong>{nameOf(g)}</strong> : {g.household}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="resto-print-only resto-print-head">
        Mariage {wedding.couple} · samedi 10 octobre 2026 · liste arrêtée le {printedOn}
      </p>

      <section className={"resto-sheet" + (allergic.length > 22 ? " is-dense" : "")}>
        <h2 className="resto-title">⚠️ Fiche allergies · cuisine et service</h2>
        <ul className="resto-legend-grid">
          {LEGEND.map(([icon, label]) => (
            <li key={label}>
              <Item icon={icon}>{label}</Item>
            </li>
          ))}
        </ul>
        {allergic.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table resto-table resto-allergies">
              <thead>
                <tr>
                  <th>Prénom</th>
                  <th>Allergie</th>
                  <th>Entrée</th>
                  <th>Plat</th>
                  <th>Fromage</th>
                </tr>
              </thead>
              <tbody>
                {allergic.map((g) => (
                  <tr key={g.key}>
                    <td>
                      <Item icon="⚠️">
                        <strong>{nameOf(g)}</strong>
                        {g.kind === "child" ? " (enfant)" : ""}
                      </Item>
                      <span className="resto-household resto-no-print">{g.household}</span>
                    </td>
                    <td className="resto-allergy">{allergyOf(g)}</td>
                    <Courses g={g} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="resto-legend">Aucune allergie renseignée pour l'instant.</p>
        )}
        <p className="resto-tip">
          Aide-mémoire : sur le marque-place de chaque convive, le picto de son plat ; ⚠️ en plus pour une allergie. L'assiette
          adaptée sort de la cuisine avec le prénom du convive.
        </p>
      </section>

      <Totals households={households} />

      <section>
        <h2 className="resto-title">Tous les convives ({guests.length})</h2>
        {pending.length > 0 && (
          <>
            <p className="rsvp__error resto-no-print">
              Pas encore de menu : {pending.map((h) => `${h.name} (${h.adults + h.children})`).join(", ")}.
            </p>
            <p className="resto-print-only resto-print-count">
              {pendingPeople} personne(s) n'ont pas encore choisi leur menu.
            </p>
          </>
        )}
        {loading && !guests.length ? (
          <p className="admin__empty">Chargement…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table resto-table resto-list">
              <thead>
                <tr>
                  <th className="resto-no-print">Foyer</th>
                  <th>Prénom</th>
                  <th>Entrée</th>
                  <th>Plat</th>
                  <th>Fromage</th>
                  <th>Allergie</th>
                  <th className="resto-no-print">RSVP</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.key} className={allergyOf(g) ? "resto-row--allergy" : ""}>
                    <td className="resto-no-print">{g.first ? g.household : ""}</td>
                    <td>
                      {field(g, "person_name", "Prénom", 60, "Prénom")}
                      <strong className="resto-print-only">{nameOf(g)}</strong>
                      {g.kind === "child" ? " (enfant)" : ""}
                    </td>
                    <Courses g={g} />
                    <td>
                      {field(g, "allergy", "Allergie", 120, "Aucune")}
                      <span className="resto-print-only">{allergyOf(g) && <Item icon="⚠️">{allergyOf(g)}</Item>}</span>
                    </td>
                    <td className="resto-no-print resto-rsvp">{g.rsvpDiet && `« ${g.rsvpDiet} »`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function RestaurantPage() {
  useEffect(() => {
    document.title = `Restaurant · ${wedding.couple}`;
  }, []);

  return (
    <AdminGate title="Restaurant">
      {({ demo, signOut }) => <RestaurantDashboard demo={demo} onSignOut={signOut} />}
    </AdminGate>
  );
}
