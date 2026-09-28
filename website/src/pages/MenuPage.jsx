// Guest menu page (/menu/:token): one block per person, review, then a final
// confirmation. Once confirmed the page only shows the recap.
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDict, useLang } from "../i18n/LanguageContext.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import { fetchMenu, confirmMenu } from "../lib/menus.js";
import { menuDict, STARTERS, ADULT_MAINS, CHILD_MAINS, CAKES } from "../content/menu.js";

function blankPeople(adults, children) {
  const make = (kind) => ({ person_name: "", kind, starter: "", main: "", cheese: null, cake: "" });
  return [...Array.from({ length: adults }, () => make("adult")), ...Array.from({ length: children }, () => make("child"))];
}

function isComplete(p) {
  if (!p.person_name.trim() || !p.main || !p.cake) return false;
  return p.kind === "child" || (p.starter && p.cheese !== null);
}

function Choice({ legend, options, value, onChange, invalid }) {
  return (
    <fieldset className={"menu-choice" + (invalid ? " is-invalid" : "")}>
      <legend>{legend}</legend>
      <div className="menu-choice__options">
        {options.map((o) => (
          <button
            type="button"
            key={String(o.value)}
            className={"menu-option" + (value === o.value ? " is-active" : "")}
            aria-pressed={value === o.value}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
          >
            <span className="menu-option__name">{o.name}</span>
            {o.desc && <span className="menu-option__desc">{o.desc}</span>}
            {o.note && <span className="menu-option__note">{o.note}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Recap({ people, dishes, t }) {
  return (
    <ul className="menu-recap">
      {people.map((p, i) => (
        <li key={i} className="menu-recap__item">
          <strong>{p.person_name}</strong>
          {p.kind === "adult" ? (
            <span>
              {dishes[p.starter]?.name} · {dishes[p.main]?.name} · {t.cheeseLine(p.cheese)} · {t.cakeLine(dishes[p.cake]?.name)}
            </span>
          ) : (
            <span>
              {dishes[p.main]?.name} · {t.cakeLine(dishes[p.cake]?.name)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function MenuPage() {
  const { token } = useParams();
  const { lang } = useLang();
  const { wedding } = useDict();
  const { dishes, ui: t, deadline } = menuDict[lang];

  const [state, setState] = useState({ status: "loading" });
  const [people, setPeople] = useState([]);
  const [step, setStep] = useState("form"); // form | review
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `${t.docTitle} · ${wedding.couple}`;
  }, [t, wedding]);

  useEffect(() => {
    let alive = true;
    fetchMenu(token)
      .then((data) => {
        if (!alive) return;
        setState({ status: "ready", ...data });
        setPeople(blankPeople(data.household.adults, data.household.children));
      })
      .catch((err) => alive && setState({ status: err.code === "not-found" ? "notfound" : "error" }));
    return () => {
      alive = false;
    };
  }, [token]);

  const contact = wedding.contactEmails.map((m, i) => (
    <span key={m}>
      {i > 0 ? t.or : ""}
      <a href={`mailto:${m}`}>{m}</a>
    </span>
  ));

  // Parts left per flavour, counting what the other people of this form picked.
  const cakesLeft = useMemo(() => {
    if (state.status !== "ready") return () => ({});
    return (self) =>
      Object.fromEntries(
        CAKES.map((c) => {
          const mine = people.filter((p, i) => i !== self && p.cake === c).length;
          return [c, state.cakeCap - (state.cakes[c] || 0) - mine];
        }),
      );
  }, [state, people]);

  const setPerson = (i, key) => (value) =>
    setPeople((list) => list.map((p, j) => (j === i ? { ...p, [key]: value } : p)));

  const goReview = (e) => {
    e.preventDefault();
    if (!people.every(isComplete)) {
      setShowErrors(true);
      setError(t.errorIncomplete);
      return;
    }
    setError("");
    setStep("review");
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await confirmMenu(token, people);
      setState((s) => ({ ...s, household: res.household, choices: res.choices }));
    } catch (err) {
      if (err.code === "cake-full") {
        setState((s) => ({ ...s, cakes: err.cakes || s.cakes }));
        setPeople((list) => list.map((p) => (p.cake === err.cake ? { ...p, cake: "" } : p)));
        setShowErrors(true);
        setError(t.errorCakeFull(dishes[err.cake]?.name || err.cake));
        setStep("form");
      } else if (err.code === "already-confirmed") {
        window.location.reload();
      } else {
        setError(t.errorGeneric);
      }
    } finally {
      setSaving(false);
    }
  };

  let body;
  if (state.status === "loading") {
    body = <p className="menu-page__muted">{t.loading}</p>;
  } else if (state.status === "notfound" || state.status === "error") {
    body = (
      <>
        <h1 className="section-title">{t.notFoundTitle}</h1>
        <p className="menu-page__muted">
          {t.notFoundText}
          {contact}.
        </p>
      </>
    );
  } else if (state.household.confirmedAt) {
    body = (
      <>
        <p className="kicker">{t.doneKicker}</p>
        <h1 className="section-title">{t.doneTitle}</h1>
        <Recap people={state.choices} dishes={dishes} t={t} />
        {state.household.confirmationSent ? (
          <p className="menu-page__muted">{t.doneEmail(state.household.email)}</p>
        ) : (
          <p className="menu-page__muted">{t.doneNoEmail}</p>
        )}
        <p className="menu-page__muted">
          {t.changeHelp}
          {contact}.
        </p>
      </>
    );
  } else if (step === "review") {
    body = (
      <>
        <p className="kicker">{t.kicker}</p>
        <h1 className="section-title">{t.reviewTitle}</h1>
        <Recap people={people} dishes={dishes} t={t} />
        <p className="menu-page__lock">{t.reviewNote}</p>
        {error && <p className="rsvp__error">{error}</p>}
        <div className="menu-page__actions">
          <button type="button" className="btn btn--gold" onClick={submit} disabled={saving}>
            {saving ? t.confirming : t.confirm}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setStep("form")} disabled={saving}>
            {t.back}
          </button>
        </div>
      </>
    );
  } else {
    let adultN = 0;
    let childN = 0;
    body = (
      <>
        <p className="kicker">{t.kicker}</p>
        <h1 className="section-title">{t.title}</h1>
        <p className="menu-page__muted">
          {t.intro(state.household.name)} {t.introDeadline(deadline)}
        </p>
        <p className="menu-page__lock">{t.lockNote}</p>

        <form className="menu-form" onSubmit={goReview} noValidate>
          {people.map((p, i) => {
            const label = p.kind === "adult" ? t.adult(++adultN) : t.child(++childN);
            const left = cakesLeft(i);
            const bad = showErrors && !isComplete(p);
            return (
              <section key={i} className={"menu-person" + (bad ? " is-invalid" : "")}>
                <h2 className="menu-person__title">{label}</h2>
                <div className={"field" + (showErrors && !p.person_name.trim() ? " is-invalid" : "")}>
                  <label htmlFor={`person-${i}`}>{t.personName}</label>
                  <input
                    id={`person-${i}`}
                    type="text"
                    maxLength={60}
                    value={p.person_name}
                    placeholder={t.personNamePh}
                    onChange={(e) => setPerson(i, "person_name")(e.target.value)}
                  />
                </div>
                {p.kind === "adult" && (
                  <Choice
                    legend={t.starter}
                    value={p.starter}
                    onChange={setPerson(i, "starter")}
                    invalid={showErrors && !p.starter}
                    options={STARTERS.map((d) => ({ value: d, ...dishes[d] }))}
                  />
                )}
                <Choice
                  legend={p.kind === "adult" ? t.main : t.childMain}
                  value={p.main}
                  onChange={setPerson(i, "main")}
                  invalid={showErrors && !p.main}
                  options={(p.kind === "adult" ? ADULT_MAINS : CHILD_MAINS).map((d) => ({ value: d, ...dishes[d] }))}
                />
                {p.kind === "adult" && (
                  <Choice
                    legend={t.cheese}
                    value={p.cheese}
                    onChange={setPerson(i, "cheese")}
                    invalid={showErrors && p.cheese === null}
                    options={[
                      { value: true, name: t.cheeseYes },
                      { value: false, name: t.cheeseNo },
                    ]}
                  />
                )}
                <Choice
                  legend={t.cake}
                  value={p.cake}
                  onChange={setPerson(i, "cake")}
                  invalid={showErrors && !p.cake}
                  options={CAKES.map((c) => ({
                    value: c,
                    name: dishes[c].name,
                    disabled: left[c] <= 0 && p.cake !== c,
                    note: left[c] <= 0 && p.cake !== c ? t.cakeFull : left[c] <= 5 ? t.cakeLeft(left[c]) : "",
                  }))}
                />
              </section>
            );
          })}

          {error && <p className="rsvp__error">{error}</p>}
          <button type="submit" className="btn btn--gold">
            {t.review}
          </button>
          <p className="menu-page__muted menu-page__small">
            {t.countHelp}
            {contact}.
          </p>
        </form>
      </>
    );
  }

  return (
    <div className="menu-page">
      <header className="menu-page__top">
        <span className="topbar__monogram">{wedding.monogram}</span>
        <LanguageToggle />
      </header>
      <main className="menu-page__inner">{body}</main>
    </div>
  );
}
