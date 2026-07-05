import { useEffect, useState, useCallback } from "react";
import { useDict } from "../i18n/LanguageContext.jsx";
import { ButtonGroup, Stepper } from "./FormControls.jsx";
import {
  listEntries,
  addEntry,
  deleteEntry,
  subscribeEntries,
  getMyEntryIds,
  carpoolMode,
} from "../lib/carpool.js";

const emptyForm = {
  type: "offer",
  name: "",
  area: "",
  seats: "3",
  contact: "",
  note: "",
  company: "", // honeypot
};

function EntryCard({ entry, deletable, confirming, onAskDelete, onConfirmDelete, onCancelDelete, t }) {
  return (
    <li className="carpool-entry">
      <div className="carpool-entry__head">
        <span className="carpool-entry__name">{entry.name}</span>
        {entry.type === "offer" && entry.seats != null && (
          <span className="carpool-entry__seats">{t.seats(entry.seats)}</span>
        )}
      </div>
      <p className="carpool-entry__area">{t.departure}{entry.area}</p>
      {entry.note && <p className="carpool-entry__note">{entry.note}</p>}
      <p className="carpool-entry__contact">{entry.contact}</p>

      {deletable &&
        (confirming ? (
          <p className="carpool-entry__confirm">
            {t.confirmDelete}
            <button type="button" className="linklike linklike--danger" onClick={onConfirmDelete}>
              {t.yes}
            </button>
            <button type="button" className="linklike" onClick={onCancelDelete}>
              {t.cancel}
            </button>
          </p>
        ) : (
          <button type="button" className="linklike linklike--danger" onClick={onAskDelete}>
            {t.delete}
          </button>
        ))}
    </li>
  );
}

function Column({ title, hint, entries, myIds, confirmId, onAskDelete, onConfirmDelete, onCancelDelete, t }) {
  return (
    <div className="carpool-col">
      <h3 className="carpool-col__title">{title}</h3>
      {entries.length === 0 ? (
        <p className="carpool-col__empty">{hint}</p>
      ) : (
        <ul className="carpool-col__list">
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              deletable={myIds.includes(e.id)}
              confirming={confirmId === e.id}
              onAskDelete={() => onAskDelete(e.id)}
              onConfirmDelete={() => onConfirmDelete(e.id)}
              onCancelDelete={() => onCancelDelete()}
              t={t}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CarpoolBoard({ variant }) {
  const { ui } = useDict();
  const t = ui.carpool;
  const [entries, setEntries] = useState([]);
  const [myIds, setMyIds] = useState(getMyEntryIds());
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listEntries();
      setEntries(data);
      setMyIds(getMyEntryIds());
      setStatus("ready");
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
      setError(t.errorRequired);
      return;
    }
    setSaving(true);
    try {
      await addEntry({ ...form, variant: variant.slug });
      setForm(emptyForm);
      setFormOpen(false);
      await refresh();
    } catch {
      setError(t.errorSubmit);
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async (id) => {
    setConfirmId(null);
    try {
      await deleteEntry(id);
      await refresh();
    } catch {
      setError(t.errorDelete);
    }
  };

  const offers = entries.filter((e) => e.type === "offer");
  const seeks = entries.filter((e) => e.type === "seek");

  const columnProps = {
    myIds,
    confirmId,
    onAskDelete: setConfirmId,
    onConfirmDelete,
    onCancelDelete: () => setConfirmId(null),
    t,
  };

  return (
    <section id="covoiturage" className="section section--carpool">
      <div className="container">
        <header className="section-head reveal">
          <p className="kicker">{t.kicker}</p>
          <h2 className="section-title">{t.title}</h2>
          <p className="carpool__intro">{t.intro}</p>
          {carpoolMode === "local" && <p className="carpool__demo">{t.demo}</p>}
        </header>

        <div className="carpool-actions reveal">
          {!formOpen && (
            <button type="button" className="btn btn--gold" onClick={() => setFormOpen(true)}>
              {t.publishCta}
            </button>
          )}
        </div>

        {formOpen && (
          <form className="carpool-form reveal" onSubmit={handleSubmit} noValidate>
            <div className="rsvp__hp" aria-hidden="true">
              <label>
                {t.honeypot}
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
              legend={t.typeLegend}
              value={form.type}
              onChange={set("type")}
              options={[
                { value: "offer", label: t.typeOffer },
                { value: "seek", label: t.typeSeek },
              ]}
            />

            <div className="field">
              <label htmlFor="cp-name">{t.nameLabel}</label>
              <input id="cp-name" type="text" value={form.name} onChange={setEvt("name")} />
            </div>

            <div className="field">
              <label htmlFor="cp-area">{t.areaLabel}</label>
              <input
                id="cp-area"
                type="text"
                value={form.area}
                onChange={setEvt("area")}
                placeholder={t.areaPlaceholder}
              />
            </div>

            {form.type === "offer" && (
              <Stepper
                id="cp-seats"
                label={t.seatsLabel}
                value={form.seats}
                min={1}
                max={8}
                onChange={set("seats")}
              />
            )}

            <div className="field">
              <label htmlFor="cp-contact">{t.contactLabel}</label>
              <input
                id="cp-contact"
                type="text"
                value={form.contact}
                onChange={setEvt("contact")}
                placeholder={t.contactPlaceholder}
              />
            </div>

            <div className="field">
              <label htmlFor="cp-note">{t.noteLabel}</label>
              <input id="cp-note" type="text" value={form.note} onChange={setEvt("note")} />
            </div>

            {error && <p className="rsvp__error">{error}</p>}

            <div className="carpool-form__actions">
              <button type="submit" className="btn btn--gold" disabled={saving}>
                {saving ? t.submitPublishing : t.submitPublish}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setFormOpen(false);
                  setError("");
                }}
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {status === "error" ? (
          <p className="rsvp__error">{t.errorLoad}</p>
        ) : (
          <div className="carpool-board">
            <Column
              title={t.colOffer}
              hint={t.colOfferEmpty}
              entries={offers}
              {...columnProps}
            />
            <Column
              title={t.colSeek}
              hint={t.colSeekEmpty}
              entries={seeks}
              {...columnProps}
            />
          </div>
        )}
      </div>
    </section>
  );
}
