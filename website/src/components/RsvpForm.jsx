import { useState } from "react";
import { wedding } from "../content/variants.js";
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
      {i > 0 ? " ou " : ""}
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
      setError("Merci de renseigner votre nom, votre email et votre réponse.");
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
      setError("Une erreur est survenue à l'envoi. Merci de réessayer.");
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    const happy = form.attending !== "no";
    return (
      <div className="container rsvp">
        <div className="rsvp__confirm reveal">
          <p className="kicker">Merci</p>
          <h2 className="section-title">
            {wasCorrection
              ? "Votre réponse a bien été mise à jour."
              : happy
                ? "Merci, nous avons hâte de vous voir !"
                : "Merci de nous avoir prévenus, vous nous manquerez."}
          </h2>
          <p className="rsvp__note">Une question ? Écrivez-nous à {contactLinks}.</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setSubmitted(false)}
          >
            Modifier ma réponse
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
        <p className="rsvp__correction reveal">
          Vous avez déjà répondu — vous pouvez modifier votre réponse ci-dessous.
        </p>
      )}

      <form className="rsvp__form reveal" onSubmit={handleSubmit} noValidate>
        {/* Honeypot (hidden from humans) */}
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

        <div className="field">
          <label htmlFor="name">Votre nom (ou celui du foyer)*</label>
          <input id="name" type="text" value={form.name} onChange={setEvt("name")} required />
        </div>

        <div className="field">
          <label htmlFor="email">Email*</label>
          <input id="email" type="email" value={form.email} onChange={setEvt("email")} required />
        </div>

        <ButtonGroup
          legend="Serez-vous présent(e) ?*"
          value={form.attending}
          onChange={set("attending")}
          options={[
            { value: "yes", label: "Avec plaisir" },
            { value: "no", label: "Malheureusement non" },
          ]}
        />

        {attending && (
          <>
            <Stepper
              id="guests"
              label="Nombre de personnes (vous inclus)"
              value={form.guests}
              min={1}
              max={20}
              onChange={set("guests")}
            />

            {rsvp.askChildren && (
              <Stepper
                id="children"
                label="Dont enfants"
                value={form.children}
                min={0}
                max={10}
                onChange={set("children")}
              />
            )}

            {rsvp.askDietary && (
              <div className="field">
                <label htmlFor="dietary">Régime alimentaire / allergies</label>
                <input
                  id="dietary"
                  type="text"
                  value={form.dietary}
                  onChange={setEvt("dietary")}
                  placeholder="Optionnel"
                />
              </div>
            )}
          </>
        )}

        <div className="field">
          <label htmlFor="message">Un mot pour les mariés (optionnel)</label>
          <textarea id="message" rows={3} value={form.message} onChange={setEvt("message")} />
        </div>

        {error && <p className="rsvp__error">{error}</p>}

        <button type="submit" className="btn btn--gold" disabled={saving}>
          {saving
            ? "Envoi…"
            : isCorrection
              ? "Mettre à jour ma réponse"
              : "J'envoie ma réponse"}
        </button>
      </form>
    </div>
  );
}
