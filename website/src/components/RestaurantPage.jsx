// Espace mariés : liste pour le restaurant (/espace-maries/restaurant)
// Une ligne par convive (prénom, entrée, plat, fromage, allergie corrigée par
// les mariés), fiche allergies pour la cuisine et le service, impression.
// Aide-mémoire : un picto par plat et ⚠️ pour une allergie, les mêmes sur la
// fiche et sur les marque-places.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGate } from "./AdminShell.jsx";
import { Totals } from "./MenusAdminPage.jsx";
import { listHouseholds, updateAllergy } from "../lib/menus.js";
import { listResponses, latestByEmail } from "../lib/rsvp.js";
import { menuDict, STARTERS, ADULT_MAINS, CHILD_MAINS } from "../content/menu.js";
import { wedding } from "../content/variants.js";

const { dishes } = menuDict.fr;

const PICTO = { veau: "🥩", gaspacho: "🥣", carrelet: "🐟", agneau: "🐑", burrata: "🌱", poulet: "🍗", poisson: "🐠" };
const NO_STARTER = "✕ Sans entrée";

const dish = (code) => `${PICTO[code]} ${dishes[code].name}`;
const starterOf = (c) => (c.starter ? dish(c.starter) : NO_STARTER);
const cheeseOf = (c) => (c.cheese ? "🧀 Fromage" : "Sans fromage");
const menuLine = (c) => (c.kind === "adult" ? [starterOf(c), dish(c.main), cheeseOf(c)] : [`Enfant : ${dish(c.main)}`]).join(" · ");

const LEGEND = [
  ...[...STARTERS, ...ADULT_MAINS].map(dish),
  NO_STARTER,
  ...CHILD_MAINS.map((k) => `${dish(k)} (enfant)`),
  "🧀 Fromage",
  "⚠️ Allergie",
].join(" · ");

function RestaurantDashboard({ demo, onSignOut }) {
  const [households, setHouseholds] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState({}); // guest key → allergy being typed

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

  const pending = households.filter((h) => !h.confirmed_at);
  // What is typed counts at once (screen and print), even before it is saved.
  const allergyOf = (g) => (g.key in drafts ? drafts[g.key] : g.allergy || "").trim();
  const allergic = guests.filter(allergyOf);
  // Wrote something in the RSVP, but no allergy reported on anyone of the
  // household yet: a real allergy may be waiting (or it was a joke).
  const toCheck = guests.filter((g) => g.rsvpDiet && !guests.some((o) => o.householdId === g.householdId && allergyOf(o)));

  const print = () => {
    if (
      toCheck.length &&
      !window.confirm(
        `${toCheck.length} foyer(s) ont écrit un régime ou une allergie dans le RSVP, sans rien de reporté sur la liste. Imprimer quand même ?`,
      )
    ) {
      return;
    }
    window.print();
  };

  const saveAllergy = async (g) => {
    if (!(g.key in drafts)) return;
    const value = drafts[g.key].trim();
    if (value !== (g.allergy || "")) {
      setError("");
      try {
        await updateAllergy(g, value);
        await load();
        setNotice(value ? `Allergie de ${g.person_name} enregistrée.` : `Allergie de ${g.person_name} effacée.`);
      } catch (e) {
        setError("Enregistrement impossible. " + (e?.message || ""));
        return; // keep what was typed
      }
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[g.key];
      return next;
    });
  };

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
        Corrigez l'allergie de chaque convive dans la colonne « Allergie » (enregistrée dès que vous quittez la case) ; la colonne
        RSVP rappelle ce que le foyer a écrit. « Imprimer / PDF » sort la fiche allergies (cuisine et service), puis les totaux et
        la liste complète.
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

      <p className="resto-print-only resto-print-head">
        Mariage {wedding.couple} · samedi 10 octobre 2026 · liste arrêtée le {printedOn}
      </p>

      <section className="resto-sheet">
        <h2 className="resto-title">⚠️ Fiche allergies · cuisine et service</h2>
        <p className="resto-legend">{LEGEND}</p>
        {allergic.length ? (
          <div className="resto-cards">
            {allergic.map((g) => (
              <article key={g.key} className="resto-card">
                <p className="resto-card__name">
                  ⚠️ {g.person_name} <span>({g.household}{g.kind === "child" ? ", enfant" : ""})</span>
                </p>
                <p className="resto-card__allergy">{allergyOf(g)}</p>
                <p className="resto-card__menu">{menuLine(g)}</p>
              </article>
            ))}
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
          <p className="rsvp__error">
            Pas encore de menu : {pending.map((h) => `${h.name} (${h.adults + h.children})`).join(", ")}.
          </p>
        )}
        {loading && !guests.length ? (
          <p className="admin__empty">Chargement…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table resto-table">
              <thead>
                <tr>
                  <th>Foyer</th>
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
                    <td>{g.first ? g.household : ""}</td>
                    <td>
                      <strong>{g.person_name}</strong>
                      {g.kind === "child" ? " (enfant)" : ""}
                    </td>
                    <td>{g.kind === "adult" ? starterOf(g) : "·"}</td>
                    <td>{dish(g.main)}</td>
                    <td>{g.kind === "adult" ? cheeseOf(g) : "·"}</td>
                    <td>
                      <input
                        className="resto-input resto-no-print"
                        type="text"
                        maxLength={120}
                        value={drafts[g.key] ?? g.allergy ?? ""}
                        placeholder="Aucune"
                        aria-label={`Allergie de ${g.person_name}`}
                        onChange={(e) => setDrafts((d) => ({ ...d, [g.key]: e.target.value }))}
                        onBlur={() => saveAllergy(g)}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      />
                      <span className="resto-print-only">{allergyOf(g) ? `⚠️ ${allergyOf(g)}` : ""}</span>
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
