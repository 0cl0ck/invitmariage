// Guest menu page (/menu/:token): one block per person, review, then a final
// confirmation. Once confirmed the page only shows the recap.
// Late invites (household.askRsvp) first say whether they come, how many,
// their diet / allergies and a note: all saved with the menus in one answer.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDict, useLang } from "../i18n/LanguageContext.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import { Stepper } from "../components/FormControls.jsx";
import { fetchMenu, confirmMenu, answerInvite } from "../lib/menus.js";
import { menuDict, STARTERS, ADULT_MAINS, CHILD_MAINS } from "../content/menu.js";

const blankPerson = (kind) => ({ person_name: "", kind, starter: "", main: "", cheese: null });

/** One block per person; keeps what was already typed when the counts change. */
function resizePeople(list, adults, children) {
  const keep = (kind, n) => {
    const current = list.filter((p) => p.kind === kind);
    return Array.from({ length: n }, (_, i) => current[i] || blankPerson(kind));
  };
  return [...keep("adult", adults), ...keep("child", children)];
}

// Steppers accept typed values: clamp them (max 20 people in all, as the RSVP).
const MAX_ADULTS = 12;
const MAX_CHILDREN = 8;
const toCount = (value, max) => Math.max(0, Math.min(max, parseInt(value, 10) || 0));

function isComplete(p) {
  if (!p.person_name.trim() || !p.main) return false;
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
              {dishes[p.starter]?.name || t.noStarter} · {dishes[p.main]?.name} · {t.cheeseLine(p.cheese)}
            </span>
          ) : (
            <span>{dishes[p.main]?.name}</span>
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
  const { dishes, ui: t } = menuDict[lang];

  const [state, setState] = useState({ status: "loading" });
  const [people, setPeople] = useState([]);
  const [step, setStep] = useState("form"); // form | review
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState({ attending: "", adults: "1", children: "0", dietary: "", message: "" });

  useEffect(() => {
    document.title = `${t.docTitle} · ${wedding.couple}`;
  }, [t, wedding]);

  useEffect(() => {
    let alive = true;
    fetchMenu(token)
      .then((data) => {
        if (!alive) return;
        setState({ status: "ready", ...data });
        // A late invite can change the counts, within the form's limits.
        const { adults, children, askRsvp } = data.household;
        const a = askRsvp ? Math.min(adults, MAX_ADULTS) : adults;
        const c = askRsvp ? Math.min(children, MAX_CHILDREN) : children;
        setPeople(resizePeople([], a, c));
        setInvite((f) => ({ ...f, adults: String(a), children: String(c) }));
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

  const setPerson = (i, key) => (value) =>
    setPeople((list) => list.map((p, j) => (j === i ? { ...p, [key]: value } : p)));

  const askRsvp = state.status === "ready" && state.household.askRsvp;
  const absent = askRsvp && invite.attending === "no";
  const setInviteField = (key) => (value) => setInvite((f) => ({ ...f, [key]: value }));
  const setCount = (key) => (value) => {
    const next = { ...invite, [key]: value };
    setInvite(next);
    setPeople((list) => resizePeople(list, toCount(next.adults, MAX_ADULTS), toCount(next.children, MAX_CHILDREN)));
  };

  const goReview = (e) => {
    e.preventDefault();
    if (askRsvp && !invite.attending) return;
    if (absent) {
      submit();
      return;
    }
    if (!people.length) {
      setError(t.errorCount);
      return;
    }
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
      const res = askRsvp
        ? await answerInvite(token, {
            attending: invite.attending,
            adults: absent ? 0 : toCount(invite.adults, MAX_ADULTS),
            children: absent ? 0 : toCount(invite.children, MAX_CHILDREN),
            dietary: absent ? "" : invite.dietary,
            message: invite.message,
            choices: absent ? [] : people,
          })
        : await confirmMenu(token, people);
      setState((s) => ({ ...s, household: res.household, choices: res.choices }));
    } catch (err) {
      if (err.code === "already-confirmed") {
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
  } else if (state.household.confirmedAt && askRsvp && state.household.adults + state.household.children === 0) {
    body = (
      <>
        <p className="kicker">{t.absentKicker}</p>
        <h1 className="section-title">{t.absentTitle}</h1>
        <p className="menu-page__muted">
          {t.absentText}
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
        {askRsvp && invite.dietary.trim() && (
          <p className="menu-page__muted">
            {t.reviewDietary}
            {invite.dietary.trim()}
          </p>
        )}
        {askRsvp && invite.message.trim() && (
          <p className="menu-page__muted">
            {t.reviewMessage}
            {invite.message.trim()}
          </p>
        )}
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
        <h1 className="section-title">{askRsvp ? t.inviteTitle : t.title}</h1>
        <p className="menu-page__muted">
          {askRsvp
            ? `${t.inviteIntro(state.household.name)} ${t.introDeadline}`
            : `${t.intro(state.household.name)} ${t.introDeadline}`}
        </p>
        {askRsvp && (
          <p className="menu-page__muted menu-page__small">
            <a href="/">{t.siteLink}</a>
          </p>
        )}
        <p className="menu-page__lock">{t.lockNote}</p>

        <form className="menu-form" onSubmit={goReview} noValidate>
          {askRsvp && (
            <Choice
              legend={t.attending}
              value={invite.attending}
              onChange={setInviteField("attending")}
              options={[
                { value: "yes", name: t.attendingYes },
                { value: "no", name: t.attendingNo },
              ]}
            />
          )}
          {askRsvp && invite.attending === "yes" && (
            <>
              <Stepper id="adults" label={t.adultsLabel} value={invite.adults} min={0} max={MAX_ADULTS} onChange={setCount("adults")} />
              <Stepper id="children" label={t.childrenLabel} value={invite.children} min={0} max={MAX_CHILDREN} onChange={setCount("children")} />
              <div className="field">
                <label htmlFor="dietary">{t.dietary}</label>
                <input
                  id="dietary"
                  type="text"
                  maxLength={200}
                  value={invite.dietary}
                  placeholder={t.dietaryPh}
                  onChange={(e) => setInviteField("dietary")(e.target.value)}
                />
              </div>
            </>
          )}
          {(!askRsvp || invite.attending === "yes") && people.map((p, i) => {
            const label = p.kind === "adult" ? t.adult(++adultN) : t.child(++childN);
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
                    options={[...STARTERS.map((d) => ({ value: d, ...dishes[d] })), { value: "none", name: t.noStarter }]}
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
              </section>
            );
          })}

          {askRsvp && invite.attending && (
            <div className="field">
              <label htmlFor="message">{t.message}</label>
              <textarea
                id="message"
                rows={3}
                maxLength={500}
                value={invite.message}
                onChange={(e) => setInviteField("message")(e.target.value)}
              />
            </div>
          )}

          {error && <p className="rsvp__error">{error}</p>}
          {(!askRsvp || invite.attending) && (
            <button type="submit" className="btn btn--gold" disabled={saving}>
              {absent ? (saving ? t.confirming : t.sendNo) : t.review}
            </button>
          )}
          {!askRsvp && (
            <p className="menu-page__muted menu-page__small">
              {t.countHelp}
              {contact}.
            </p>
          )}
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
