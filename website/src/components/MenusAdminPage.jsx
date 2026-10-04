// Espace mariés : choix des menus (/espace-maries/menus)
// Liens personnels par foyer (créés depuis les RSVP « oui »), envoi des
// demandes par email, suivi, totaux pour le restaurant, export CSV.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminGate } from "./AdminShell.jsx";
import { ButtonGroup, Stepper } from "./FormControls.jsx";
import { listResponses, latestByEmail } from "../lib/rsvp.js";
import {
  listHouseholds,
  createHouseholds,
  updateHousehold,
  reopenHousehold,
  deleteHousehold,
  sendRequests,
  chooseForHousehold,
  menuUrl,
} from "../lib/menus.js";
import { menuDict, STARTERS, ADULT_MAINS, CHILD_MAINS } from "../content/menu.js";
import { wedding } from "../content/variants.js";

const { dishes } = menuDict.fr;
// Adults may skip the starter (null in the database, "none" in the forms).
const starterName = (starter) => (starter && starter !== "none" ? dishes[starter].name : "Sans entrée");
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

/** Late invite (ask_rsvp) who answered « absent »: confirmed with nobody. */
const isAbsent = (h) => Boolean(h.ask_rsvp && h.confirmed_at && h.adults + h.children === 0);

/** RSVP « oui » (latest per email) that have no menu household yet. */
function missingFromRsvp(rsvps, households) {
  const linkedEmails = new Set(households.map((h) => (h.email || "").toLowerCase()).filter(Boolean));
  const linkedIds = new Set(households.map((h) => h.rsvp_id).filter(Boolean));
  // Fallback for guests without email whose RSVP row was replaced or cleaned up.
  const linkedNames = new Set(households.map((h) => h.name.trim().toLowerCase()));
  return latestByEmail(rsvps)
    .filter((r) => r.attending === "yes")
    .filter((r) => !linkedIds.has(r.id))
    .filter((r) => (r.email ? !linkedEmails.has(r.email.toLowerCase()) : !linkedNames.has(r.name.trim().toLowerCase())))
    .map((r) => {
      const children = Math.max(0, Number(r.children) || 0);
      return {
        rsvp_id: r.id,
        name: r.name,
        email: r.email || null,
        adults: Math.max(0, (Number(r.guests) || 1) - children),
        children,
      };
    });
}

function toCsv(households) {
  // Quote, and neutralise spreadsheet formulas typed by guests (=, +, -, @).
  const esc = (v) => {
    const text = String(v ?? "");
    return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  };
  const head = ["Foyer", "Personne", "Type", "Entrée", "Plat", "Fromage", "Allergie", "Email", "Confirmé le"];
  const lines = [];
  for (const h of households) {
    if (!h.confirmed_at) {
      lines.push([h.name, "", `En attente (${h.adults} adulte(s), ${h.children} enfant(s))`, "", "", "", "", "", h.email, ""]);
      continue;
    }
    for (const c of h.choices) {
      lines.push([
        h.name,
        c.person_name,
        c.kind === "adult" ? "Adulte" : "Enfant",
        c.kind === "adult" ? starterName(c.starter) : "",
        c.main ? dishes[c.main].name : "Pas de menu enfant",
        c.kind === "adult" ? (c.cheese ? "Oui" : "Non") : "",
        c.allergy || "",
        h.email,
        fmtDate(h.confirmed_at),
      ]);
    }
  }
  return [head, ...lines].map((l) => l.map(esc).join(",")).join("\n");
}

function EditForm({ household, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: household.name,
    email: household.email || "",
    adults: String(household.adults),
    children: String(household.children),
  });
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const email = form.email.trim();
    if (!form.name.trim()) return setError("Le nom est obligatoire.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("L'email semble incorrect.");
    const adults = parseInt(form.adults, 10) || 0;
    const children = parseInt(form.children, 10) || 0;
    if (adults + children < 1) return setError("Il faut au moins une personne.");
    try {
      const counts = household.confirmed_at ? {} : { adults, children };
      await onSave({ name: form.name.trim(), email: email || null, ...counts });
    } catch (err) {
      setError("Enregistrement impossible. " + (err?.message || ""));
    }
  };

  return (
    <form className="admin-form" onSubmit={submit} noValidate>
      <div className="admin-form__row">
        <div className="field">
          <label htmlFor="mh-name">Foyer</label>
          <input id="mh-name" type="text" maxLength={80} value={form.name} onChange={(e) => set("name")(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mh-email">Email (vide si aucun)</label>
          <input id="mh-email" type="email" maxLength={120} value={form.email} onChange={(e) => set("email")(e.target.value)} />
        </div>
      </div>
      <div className="admin-form__row">
        {household.confirmed_at ? (
          <p className="admin-panel__hint">
            {household.adults} adulte(s), {household.children} enfant(s) : menu déjà confirmé, « Rouvrir » pour changer le nombre.
          </p>
        ) : (
          <>
            <Stepper id="mh-adults" label="Adultes" value={form.adults} min={0} max={20} onChange={set("adults")} />
            <Stepper id="mh-children" label="Enfants" value={form.children} min={0} max={12} onChange={set("children")} />
          </>
        )}
      </div>
      {error && <p className="rsvp__error">{error}</p>}
      <div className="admin-form__actions">
        <button type="submit" className="btn btn--gold">Enregistrer</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

/** Current choices when confirmed (to change them), else one blank row per person. */
function initialPeople(h) {
  if (h.confirmed_at && h.choices.length) {
    return h.choices.map((c) => ({
      person_name: c.person_name,
      kind: c.kind,
      starter: c.kind === "adult" ? c.starter || "none" : "",
      main: c.main || (c.kind === "child" ? "none" : ""),
      cheese: c.cheese,
      allergy: c.allergy || "",
    }));
  }
  const make = (kind) => ({ person_name: "", kind, starter: "", main: "", cheese: null, allergy: "" });
  return [...Array.from({ length: h.adults }, () => make("adult")), ...Array.from({ length: h.children }, () => make("child"))];
}

function isComplete(p) {
  if (!p.person_name.trim() || !p.main) return false;
  return p.kind === "child" || (p.starter && p.cheese !== null);
}

/** The mariés fill in the menus for a household (no email, or can't use the link). */
function ChooseForm({ household, busy, onSave, onCancel }) {
  const [people, setPeople] = useState(() => initialPeople(household));
  const [showErrors, setShowErrors] = useState(false);
  const panel = useRef(null);

  useEffect(() => {
    panel.current?.scrollIntoView({ block: "start" });
  }, []);

  const setPerson = (i, key) => (value) => setPeople((list) => list.map((p, j) => (j === i ? { ...p, [key]: value } : p)));

  let adultN = 0;
  let childN = 0;
  const labels = people.map((p) => (p.kind === "adult" ? `Adulte ${++adultN}` : `Enfant ${++childN}`));
  const missing = labels.filter((_, i) => !isComplete(people[i]));

  const submit = (e) => {
    e.preventDefault();
    if (missing.length) return setShowErrors(true);
    onSave(people.map((p) => ({ ...p, person_name: p.person_name.trim() })));
  };

  return (
    <div className="admin-panel" ref={panel}>
      <h3 className="admin-panel__title">
        {household.confirmed_at ? "Changer les menus de" : "Choisir les menus de"} {household.name}
      </h3>
      <p className="admin-panel__hint">
        Vous remplissez à leur place : le menu est confirmé tout de suite, aucun email n'est envoyé à l'invité.
        {household.confirmed_at && " Ses choix actuels sont pré-remplis."}
      </p>
      <form className="admin-form" onSubmit={submit} noValidate>
        {people.map((p, i) => (
          <section key={i} className={"menu-person" + (showErrors && !isComplete(p) ? " is-invalid" : "")}>
            <h4 className="menu-person__title">{labels[i]}</h4>
            <div className={"field" + (showErrors && !p.person_name.trim() ? " is-invalid" : "")}>
              <label htmlFor={`choose-${i}`}>Prénom</label>
              <input id={`choose-${i}`} type="text" maxLength={60} value={p.person_name} onChange={(e) => setPerson(i, "person_name")(e.target.value)} />
            </div>
            {p.kind === "adult" && (
              <ButtonGroup
                legend="Entrée"
                value={p.starter}
                onChange={setPerson(i, "starter")}
                options={[...STARTERS.map((d) => ({ value: d, label: dishes[d].name })), { value: "none", label: "Sans entrée" }]}
              />
            )}
            <ButtonGroup
              legend={p.kind === "adult" ? "Plat" : "Menu enfant"}
              value={p.main}
              onChange={setPerson(i, "main")}
              options={
                p.kind === "adult"
                  ? ADULT_MAINS.map((d) => ({ value: d, label: dishes[d].name }))
                  : [...CHILD_MAINS.map((d) => ({ value: d, label: dishes[d].name })), { value: "none", label: "Pas de menu enfant" }]
              }
            />
            {p.kind === "adult" && (
              <ButtonGroup
                legend="Fromage"
                value={p.cheese}
                onChange={setPerson(i, "cheese")}
                options={[
                  { value: true, label: "Oui" },
                  { value: false, label: "Non" },
                ]}
              />
            )}
            <div className="field">
              <label htmlFor={`choose-allergy-${i}`}>Allergie / régime (pour le restaurant)</label>
              <input
                id={`choose-allergy-${i}`}
                type="text"
                maxLength={120}
                value={p.allergy}
                placeholder="Vide si aucune"
                onChange={(e) => setPerson(i, "allergy")(e.target.value)}
              />
            </div>
          </section>
        ))}
        {showErrors && missing.length > 0 && <p className="rsvp__error">Il manque des choix pour : {missing.join(", ")}.</p>}
        <div className="admin-form__actions">
          <button type="submit" className="btn btn--gold" disabled={busy}>
            Enregistrer et confirmer
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export function Totals({ households }) {
  const t = useMemo(() => {
    const count = Object.fromEntries([...STARTERS, ...ADULT_MAINS, ...CHILD_MAINS].map((k) => [k, 0]));
    let cheese = 0;
    let noStarter = 0;
    let noChildMenu = 0;
    for (const h of households) {
      if (!h.confirmed_at) continue;
      for (const c of h.choices) {
        if (c.starter) count[c.starter] += 1;
        else if (c.kind === "adult") noStarter += 1;
        if (c.main) count[c.main] += 1;
        else noChildMenu += 1;
        if (c.cheese) cheese += 1;
      }
    }
    return { count, cheese, noStarter, noChildMenu };
  }, [households]);

  const group = (title, keys, suffix = () => "") => (
    <div className="menu-totals__group">
      <p className="menu-totals__title">{title}</p>
      {keys.map((k) => (
        <p key={k} className="menu-totals__line">
          <strong>{t.count[k]}</strong> {dishes[k].name}
          {suffix(k)}
        </p>
      ))}
    </div>
  );

  return (
    <div className="admin-panel menu-totals">
      <div className="menu-totals__group">
        <p className="menu-totals__title">Entrées</p>
        {STARTERS.map((k) => (
          <p key={k} className="menu-totals__line">
            <strong>{t.count[k]}</strong> {dishes[k].name}
          </p>
        ))}
        {t.noStarter > 0 && (
          <p className="menu-totals__line">
            <strong>{t.noStarter}</strong> Sans entrée
          </p>
        )}
      </div>
      {group("Plats", ADULT_MAINS)}
      <div className="menu-totals__group">
        <p className="menu-totals__title">Menu enfant</p>
        {CHILD_MAINS.map((k) => (
          <p key={k} className="menu-totals__line">
            <strong>{t.count[k]}</strong> {dishes[k].name}
          </p>
        ))}
        {t.noChildMenu > 0 && (
          <p className="menu-totals__line">
            <strong>{t.noChildMenu}</strong> Sans menu enfant
          </p>
        )}
      </div>
      <div className="menu-totals__group">
        <p className="menu-totals__title">Fromages</p>
        <p className="menu-totals__line">
          <strong>{t.cheese}</strong> assiettes
        </p>
      </div>
    </div>
  );
}

function MenusDashboard({ demo, onSignOut }) {
  const [households, setHouseholds] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [choosing, setChoosing] = useState(null);
  const [inviting, setInviting] = useState(false);

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

  // Runs an action, then reloads; reports errors in the banner.
  const run = async (fn, okMsg) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await fn();
      await load();
      if (okMsg) setNotice(typeof okMsg === "function" ? okMsg(result) : okMsg);
    } catch (e) {
      setError("Action impossible. " + (e?.detail || e?.message || ""));
    } finally {
      setBusy(false);
    }
  };

  const missing = useMemo(() => missingFromRsvp(rsvps, households), [rsvps, households]);
  const toSend = households.filter((h) => h.email && !h.request_sent_at && !h.confirmed_at);
  const toRemind = households.filter((h) => h.email && h.request_sent_at && !h.confirmed_at);
  const absent = households.filter(isAbsent);
  const confirmed = households.filter((h) => h.confirmed_at && !isAbsent(h));
  const people = households.reduce((s, h) => s + h.adults + h.children, 0);
  const noEmail = households.filter((h) => !h.email && !h.confirmed_at).length;

  const send = (list, label) => {
    if (!list.length) return;
    if (!window.confirm(`${label} : envoyer l'email à ${list.length} foyer(s) ?`)) return;
    run(() => sendRequests(list.map((h) => h.id)), (r) => `${r.sent} email(s) envoyé(s).`);
  };

  const copyLink = async (h) => {
    try {
      await navigator.clipboard.writeText(menuUrl(h));
      setNotice(`Lien de ${h.name} copié : collez-le dans WhatsApp ou un SMS.`);
    } catch {
      window.prompt("Copiez ce lien :", menuUrl(h));
    }
  };

  const downloadCsv = () => {
    const blob = new Blob(["﻿" + toCsv(households)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menus-mariage-10-octobre.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const status = (h) => {
    if (isAbsent(h)) return `✗ Absent (réponse du ${fmtDate(h.confirmed_at)})`;
    if (h.confirmed_at) return `✓ Confirmé le ${fmtDate(h.confirmed_at)}`;
    if (h.request_sent_at) return `Envoyé le ${fmtDate(h.request_sent_at)}`;
    return h.email ? "Pas encore envoyé" : "Sans email : lien à envoyer";
  };

  return (
    <>
      <div className="admin__bar">
        <div className="admin-stats">
          <span className="admin-stat"><strong>{households.length}</strong> foyers</span>
          <span className="admin-stat"><strong>{people}</strong> personnes</span>
          <span className="admin-stat"><strong>{confirmed.length}</strong> confirmés</span>
          {absent.length > 0 && <span className="admin-stat"><strong>{absent.length}</strong> absent(s)</span>}
          <span className="admin-stat"><strong>{households.length - confirmed.length - absent.length}</strong> en attente</span>
          {noEmail > 0 && <span className="admin-stat"><strong>{noEmail}</strong> sans email</span>}
        </div>
        <div className="admin__actions">
          {missing.length > 0 && (
            <button
              className="btn btn--gold"
              disabled={busy}
              onClick={() => run(() => createHouseholds(missing), (n) => `${n ?? missing.length} lien(s) créé(s).`)}
              title="Un lien personnel pour chaque réponse RSVP « présent » qui n'en a pas encore"
            >
              Créer les liens manquants ({missing.length})
            </button>
          )}
          <button
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => {
              setEditing(null);
              setChoosing(null);
              setInviting((open) => !open);
            }}
          >
            + Invité de dernière minute
          </button>
          <button className="btn btn--gold" disabled={busy || !toSend.length} onClick={() => send(toSend, "Première demande")}>
            Envoyer la demande ({toSend.length})
          </button>
          <button className="btn btn--ghost" disabled={busy || !toRemind.length} onClick={() => send(toRemind, "Relance")}>
            Relancer ({toRemind.length})
          </button>
          <button className="btn btn--ghost" onClick={() => { setLoading(true); load(); }} disabled={loading || busy}>
            {loading ? "…" : "Rafraîchir"}
          </button>
          <button className="btn btn--ghost" onClick={downloadCsv} disabled={!households.length}>
            Export CSV
          </button>
          {!demo && (
            <button className="btn btn--ghost" onClick={onSignOut} disabled={busy}>
              Se déconnecter
            </button>
          )}
        </div>
      </div>

      {error && <p className="rsvp__error">{error}</p>}
      {notice && <p className="admin__notice">{notice}</p>}
      {demo && (
        <p className="carpool__demo">
          Mode démo (données locales à cet appareil, aucun email envoyé). Lien invité de test : /menu/{"0".repeat(32)}
        </p>
      )}

      <Totals households={households} />

      {inviting && (
        <div className="admin-panel">
          <h3 className="admin-panel__title">Inviter quelqu'un à la dernière minute</h3>
          <p className="admin-panel__hint">
            Son lien lui demande s'il vient, combien ils seront (votre nombre n'est qu'une proposition), régime ou allergies, un mot,
            puis le menu de chacun. Sa réponse arrive aussi dans les réponses RSVP. Ensuite : la langue sur sa ligne, puis « Envoyer »
            (ou « Copier le lien » s'il n'a pas d'email).
          </p>
          <EditForm
            household={{ name: "", email: null, adults: 1, children: 0, confirmed_at: null }}
            onCancel={() => setInviting(false)}
            onSave={(patch) =>
              run(async () => {
                await createHouseholds([{ ...patch, ask_rsvp: true }]);
                setInviting(false);
              }, `${patch.name} ajouté(e) : choisissez sa langue puis « Envoyer » sur sa ligne.`)
            }
          />
        </div>
      )}

      {editing && (
        <div className="admin-panel">
          <h3 className="admin-panel__title">Modifier le foyer {editing.name}</h3>
          <p className="admin-panel__hint">
            Le nombre de personnes fixe le nombre de menus à choisir. Pour changer un menu déjà confirmé, utilisez « Rouvrir ».
          </p>
          <EditForm
            key={editing.id}
            household={editing}
            onCancel={() => setEditing(null)}
            onSave={(patch) =>
              run(async () => {
                await updateHousehold(editing.id, patch);
                setEditing(null);
              }, "Foyer mis à jour.")
            }
          />
        </div>
      )}

      {choosing && (
        <ChooseForm
          key={choosing.id}
          household={choosing}
          busy={busy}
          onCancel={() => setChoosing(null)}
          onSave={(choices) =>
            run(async () => {
              await chooseForHousehold(choosing.id, choices);
              setChoosing(null);
            }, `Menus de ${choosing.name} enregistrés.`)
          }
        />
      )}

      {loading && !households.length ? (
        <p className="admin__empty">Chargement…</p>
      ) : !households.length ? (
        <p className="admin__empty">
          Aucun lien pour le moment. Cliquez sur « Créer les liens manquants » pour en générer un par foyer présent.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Foyer</th>
                <th>Pers.</th>
                <th>Langue</th>
                <th>Statut</th>
                <th>Choix</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {households.map((h) => (
                <tr key={h.id} className={isAbsent(h) ? "is-absent" : h.confirmed_at ? "is-present" : ""}>
                  <td>
                    <span className="admin-name">{h.name}</span>
                    <span className="admin-email">{h.email || "Sans email"}</span>
                    {h.ask_rsvp && <span className="admin-tag">Dernière minute</span>}
                  </td>
                  <td>
                    {h.adults} ad.{h.children ? ` + ${h.children} enf.` : ""}
                  </td>
                  <td>
                    <select
                      className="menu-lang"
                      value={h.lang}
                      disabled={busy}
                      onChange={(e) => run(() => updateHousehold(h.id, { lang: e.target.value }))}
                      aria-label={`Langue des emails de ${h.name}`}
                    >
                      <option value="fr">FR</option>
                      <option value="es">ES</option>
                    </select>
                  </td>
                  <td>{status(h)}</td>
                  <td className="menu-admin-choices">
                    {h.choices.map((c) => (
                      <span key={c.id || c.position}>
                        <strong>{c.person_name}</strong> :{" "}
                        {[c.kind === "adult" && starterName(c.starter), c.main ? dishes[c.main].name : "pas de menu enfant", c.kind === "adult" && (c.cheese ? "fromage" : "sans fromage"), c.allergy && `⚠️ ${c.allergy}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ))}
                    {!h.choices.length && "·"}
                  </td>
                  <td className="admin-row-actions menu-admin-actions">
                    {!h.confirmed_at && h.email && (
                      <button type="button" className="linklike" disabled={busy} onClick={() => send([h], h.request_sent_at ? "Relance" : "Demande")}>
                        {h.request_sent_at ? "Renvoyer" : "Envoyer"}
                      </button>
                    )}
                    {!h.confirmed_at && (
                      <button type="button" className="linklike" onClick={() => copyLink(h)}>
                        Copier le lien
                      </button>
                    )}
                    {!h.confirmed_at && (
                      <button
                        type="button"
                        className="linklike"
                        disabled={busy}
                        title="M'envoyer cet email à moi : rien n'est envoyé à l'invité"
                        onClick={() =>
                          run(
                            () => sendRequests([h.id], { preview: true }),
                            (r) => `Aperçu de l'email de ${h.name} envoyé à ${r.to || "votre adresse"} (rien n'est parti chez l'invité).`,
                          )
                        }
                      >
                        Aperçu
                      </button>
                    )}
                    {/* A late invite answers presence on its own link (or ours, opened via « Copier le lien »). */}
                    {(h.ask_rsvp ? h.confirmed_at && !isAbsent(h) : true) && (
                      <button
                        type="button"
                        className="linklike"
                        disabled={busy}
                        onClick={() => {
                          setEditing(null);
                          setInviting(false);
                          setChoosing(h);
                        }}
                        title="Remplir les menus à leur place (aucun email envoyé)"
                      >
                        {h.confirmed_at ? "Changer les menus" : "Choisir pour eux"}
                      </button>
                    )}
                    {h.confirmed_at && (
                      <button
                        type="button"
                        className="linklike"
                        disabled={busy}
                        onClick={() =>
                          window.confirm(`Rouvrir le menu de ${h.name} ? Ses choix (et les allergies corrigées) sont effacés et son lien fonctionne à nouveau.`) &&
                          run(() => reopenHousehold(h.id), `Menu de ${h.name} rouvert.`)
                        }
                      >
                        Rouvrir
                      </button>
                    )}
                    <button
                      type="button"
                      className="linklike"
                      disabled={busy}
                      onClick={() => {
                        setChoosing(null);
                        setInviting(false);
                        setEditing(h);
                      }}
                      aria-label={`Modifier ${h.name}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="linklike linklike--danger"
                      disabled={busy}
                      aria-label={`Supprimer ${h.name}`}
                      onClick={() =>
                        window.confirm(`Supprimer le foyer ${h.name} et ses choix ? Son lien ne fonctionnera plus.`) &&
                        run(() => deleteHousehold(h.id), `Foyer ${h.name} supprimé.`)
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function MenusAdminPage() {
  useEffect(() => {
    document.title = `Menus · ${wedding.couple}`;
  }, []);

  return (
    <AdminGate title="Menus">
      {({ demo, signOut }) => <MenusDashboard demo={demo} onSignOut={signOut} />}
    </AdminGate>
  );
}
