import { useState } from "react";
import { useDict } from "../i18n/LanguageContext.jsx";
import { ButtonGroup, Stepper } from "./FormControls.jsx";
import { submitResponse, getMyResponse } from "../lib/rsvp.js";

const blankState = {
  name: "",
  email: "",
  attending: "", // "yes" | "no"
  guests: "2",
  dietary: "",
  children: "0",
  message: "",
  company: "", // honeypot (must stay empty)
};

function prefillFrom(prior) {
  if (!prior) return blankState;
  return {
    ...blankState,
    name: prior.name || "",
    email: prior.email || "",
    attending: prior.attending || "",
    guests: prior.guests != null ? String(prior.guests) : "2",
    children: prior.children != null ? String(prior.children) : "0",
    dietary: prior.dietary || "",
    message: prior.message || "",
  };
}

export default function RsvpForm({ variant }) {
  const { wedding, ui } = useDict();
  const t = ui.rsvp;
  const rsvp = variant.rsvp;
  const prior = getMyResponse();
  const [form, setForm] = useState(() => prefillFrom(prior));
  const [isCorrection, setIsCorrection] = useState(Boolean(prior));
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrection, setWasCorrection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setEvt = (key) => (e) => set(key)(e.target.value);

  const contactLinks = wedding.contactEmails.map((m, i) => (
    <span key={m}>
      {i > 0 ? t.emailSep : ""}
      <a href={`mailto:${m}`}>{m}</a>
    </span>
  ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.company) {
      setSubmitted(true); // honeypot: ignore bots silently
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.attending) {
      setError(t.errorRequired);
      return;
    }

    setSaving(true);
    try {
      await submitResponse({ variant: variant.slug, ...form });
      setWasCorrection(isCorrection);
      setIsCorrection(true); // a further submit is now a correction
      setSubmitted(true);
    } catch (err) {
      // Surface the real cause in the browser console (this is a client->Supabase
      // call; it never reaches the Vercel server logs).
      // eslint-disable-next-line no-console
      console.error("[RSVP] échec d'envoi :", err);
      setError(t.errorSubmit);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    const happy = form.attending !== "no";
    return (
      <div className="container rsvp">
        <div className="rsvp__confirm reveal">
          <p className="kicker">{t.thanksKicker}</p>
          <h2 className="section-title">
            {wasCorrection
              ? t.thanksUpdated
              : happy
                ? t.thanksYes
                : t.thanksNo}
          </h2>
          <p className="rsvp__note">{t.contactBefore}{contactLinks}.</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setSubmitted(false)}
          >
            {t.editAnswer}
          </button>
        </div>
      </div>
    );
  }

  const attending = form.attending === "yes";

  return (
    <div className="container rsvp">
      <header className="section-head reveal">
        <p className="kicker">{rsvp.kicker}</p>
        <h2 className="section-title">{rsvp.title}</h2>
        <p className="rsvp__intro">{rsvp.intro}</p>
      </header>

      {isCorrection && (
        <p className="rsvp__correction reveal">{t.correction}</p>
      )}

      <form className="rsvp__form reveal" onSubmit={handleSubmit} noValidate>
        {/* Honeypot (hidden from humans) */}
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

        <div className="field">
          <label htmlFor="name">{t.nameLabel}</label>
          <input id="name" type="text" value={form.name} onChange={setEvt("name")} required />
        </div>

        <div className="field">
          <label htmlFor="email">{t.emailLabel}</label>
          <input id="email" type="email" value={form.email} onChange={setEvt("email")} required />
        </div>

        <ButtonGroup
          legend={t.attendingLegend}
          value={form.attending}
          onChange={set("attending")}
          options={[
            { value: "yes", label: t.attendingYes },
            { value: "no", label: t.attendingNo },
          ]}
        />

        {attending && (
          <>
            <Stepper
              id="guests"
              label={t.guestsLabel}
              value={form.guests}
              min={1}
              max={20}
              onChange={set("guests")}
            />

            {rsvp.askChildren && (
              <Stepper
                id="children"
                label={t.childrenLabel}
                value={form.children}
                min={0}
                max={10}
                onChange={set("children")}
              />
            )}

            {rsvp.askDietary && (
              <div className="field">
                <label htmlFor="dietary">{t.dietaryLabel}</label>
                <input
                  id="dietary"
                  type="text"
                  value={form.dietary}
                  onChange={setEvt("dietary")}
                  placeholder={t.dietaryPlaceholder}
                />
              </div>
            )}
          </>
        )}

        <div className="field">
          <label htmlFor="message">{t.messageLabel}</label>
          <textarea id="message" rows={3} value={form.message} onChange={setEvt("message")} />
        </div>

        {error && <p className="rsvp__error">{error}</p>}

        <button type="submit" className="btn btn--gold" disabled={saving}>
          {saving
            ? t.submitSending
            : isCorrection
              ? t.submitUpdate
              : t.submitSend}
        </button>
      </form>
    </div>
  );
}
