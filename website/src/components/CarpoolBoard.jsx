import { useEffect, useState, useCallback } from "react";
import { ButtonGroup, Stepper } from "./FormControls.jsx";
import { listEntries, addEntry, subscribeEntries, carpoolMode } from "../lib/carpool.js";

const emptyForm = {
  type: "offer",
  name: "",
  area: "",
  seats: "3",
  contact: "",
  note: "",
  company: "", // honeypot
};

function EntryCard({ entry }) {
  return (
    <li className="carpool-entry">
      <div className="carpool-entry__head">
        <span className="carpool-entry__name">{entry.name}</span>
        {entry.type === "offer" && entry.seats != null && (
          <span className="carpool-entry__seats">
            {entry.seats} place{entry.seats > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="carpool-entry__area">Départ : {entry.area}</p>
      {entry.note && <p className="carpool-entry__note">{entry.note}</p>}
      <p className="carpool-entry__contact">{entry.contact}</p>
    </li>
  );
}

function Column({ title, hint, entries }) {
  return (
    <div className="carpool-col">
      <h3 className="carpool-col__title">{title}</h3>
      {entries.length === 0 ? (
        <p className="carpool-col__empty">{hint}</p>
      ) : (
        <ul className="carpool-col__list">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CarpoolBoard({ variant }) {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listEntries();
      setEntries(data);
      setStatus("ready");
      // layout changed -> recompute scroll triggers
      window.__ST?.refresh?.();
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeEntries(refresh);
    return unsub;
  }, [refresh]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setEvt = (key) => (e) => set(key)(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.company) {
      setForm(emptyForm);
      setFormOpen(false);
      return; // honeypot
    }
    if (!form.name.trim() || !form.area.trim() || !form.contact.trim()) {
      setError("Merci d'indiquer un prénom, un secteur de départ et un contact.");
      return;
    }
    setSaving(true);
    try {
      await addEntry({ ...form, variant: variant.slug });
      setForm(emptyForm);
      setFormOpen(false);
      await refresh();
    } catch {
      setError("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const offers = entries.filter((e) => e.type === "offer");
  const seeks = entries.filter((e) => e.type === "seek");

  return (
    <section id="covoiturage" className="section section--carpool">
      <div className="container">
        <header className="section-head reveal">
          <p className="kicker">Entraide</p>
          <h2 className="section-title">Covoiturage</h2>
          <p className="carpool__intro">
            Organisez-vous entre invités : proposez des places ou trouvez un trajet.
          </p>
          {carpoolMode === "local" && (
            <p className="carpool__demo">
              Mode démo (local à cet appareil) — la base partagée sera activée à la
              configuration de Supabase.
            </p>
          )}
        </header>

        <div className="carpool-actions reveal">
          {!formOpen && (
            <button type="button" className="btn btn--gold" onClick={() => setFormOpen(true)}>
              + Publier une annonce
            </button>
          )}
        </div>

        {formOpen && (
          <form className="carpool-form reveal" onSubmit={handleSubmit} noValidate>
            <div className="rsvp__hp" aria-hidden="true">
              <label>
                Ne pas remplir
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={setEvt("company")}
                />
              </label>
            </div>

            <ButtonGroup
              legend="Type d'annonce"
              value={form.type}
              onChange={set("type")}
              options={[
                { value: "offer", label: "Je propose des places" },
                { value: "seek", label: "Je cherche une place" },
              ]}
            />

            <div className="field">
              <label htmlFor="cp-name">Prénom*</label>
              <input id="cp-name" type="text" value={form.name} onChange={setEvt("name")} />
            </div>

            <div className="field">
              <label htmlFor="cp-area">Secteur de départ*</label>
              <input
                id="cp-area"
                type="text"
                value={form.area}
                onChange={setEvt("area")}
                placeholder="Ville / quartier"
              />
            </div>

            {form.type === "offer" && (
              <Stepper
                id="cp-seats"
                label="Places disponibles"
                value={form.seats}
                min={1}
                max={8}
                onChange={set("seats")}
              />
            )}

            <div className="field">
              <label htmlFor="cp-contact">Contact* (téléphone ou email)</label>
              <input
                id="cp-contact"
                type="text"
                value={form.contact}
                onChange={setEvt("contact")}
                placeholder="Visible par les invités"
              />
            </div>

            <div className="field">
              <label htmlFor="cp-note">Précisions (optionnel)</label>
              <input id="cp-note" type="text" value={form.note} onChange={setEvt("note")} />
            </div>

            {error && <p className="rsvp__error">{error}</p>}

            <div className="carpool-form__actions">
              <button type="submit" className="btn btn--gold" disabled={saving}>
                {saving ? "Publication…" : "Publier"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setFormOpen(false);
                  setError("");
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {status === "error" ? (
          <p className="rsvp__error">Le tableau n'a pas pu être chargé. Réessayez plus tard.</p>
        ) : (
          <div className="carpool-board">
            <Column
              title="Je propose"
              hint="Aucune place proposée pour l'instant."
              entries={offers}
            />
            <Column
              title="Je cherche"
              hint="Personne ne cherche de place pour l'instant."
              entries={seeks}
            />
          </div>
        )}
      </div>
    </section>
  );
}
