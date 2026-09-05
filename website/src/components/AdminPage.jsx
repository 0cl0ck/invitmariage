// Espace mariés : réponses RSVP (/espace-maries)
// Récap, tableau, export CSV, nettoyage des doublons, suppression, et saisie
// à la main des réponses d'invités qui ne passent pas par le site.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGate } from "./AdminShell.jsx";
import { ButtonGroup, Stepper } from "./FormControls.jsx";
import {
  listResponses,
  latestByEmail,
  duplicateIds,
  idsForRow,
  deleteResponses,
  addManualResponse,
} from "../lib/rsvp.js";
import { wedding } from "../content/variants.js";

function toCsv(rows) {
  const cols = [
    ["name", "Nom"],
    ["email", "Email"],
    ["attending", "Réponse"],
    ["guests", "Personnes"],
    ["children", "Enfants"],
    ["dietary", "Régime"],
    ["message", "Message"],
    ["variant", "Variante"],
    ["source", "Source"],
    ["created_at", "Date"],
  ];
  const cell = (r, key) => {
    if (key === "source") return r.source === "manual" ? "Saisie mariés" : "Site";
    return r[key];
  };
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = cols.map(([, label]) => esc(label)).join(",");
  const body = rows
    .map((r) => cols.map(([key]) => esc(cell(r, key))).join(","))
    .join("\n");
  return head + "\n" + body;
}

/* ------------------------ manual entry form (mariés) ---------------------- */
const emptyManual = {
  name: "",
  email: "",
  attending: "yes",
  guests: "1",
  children: "0",
  dietary: "",
  message: "",
};

function ManualResponseForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...emptyManual,
    ...(initial
      ? {
          name: initial.name || "",
          email: initial.email || "",
          attending: initial.attending === "no" ? "no" : "yes",
          guests: String(initial.guests || 1),
          children: String(initial.children || 0),
          dietary: initial.dietary || "",
          message: initial.message || "",
        }
      : null),
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setEvt = (key) => (e) => set(key)(e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Merci d'indiquer le nom de l'invité (ou du foyer).");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("L'email semble incorrect (laissez-le vide s'il n'y en a pas).");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError("Enregistrement impossible. " + (err?.message || ""));
      setSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={submit} noValidate>
      <div className="admin-form__row">
        <div className="field">
          <label htmlFor="man-name">Nom (ou foyer)*</label>
          <input id="man-name" type="text" value={form.name} onChange={setEvt("name")} maxLength={80} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="man-email">Email (optionnel)</label>
          <input
            id="man-email"
            type="email"
            value={form.email}
            onChange={setEvt("email")}
            maxLength={120}
            placeholder="Laisser vide si l'invité n'en a pas"
          />
        </div>
      </div>

      <ButtonGroup
        legend="Réponse*"
        value={form.attending}
        onChange={set("attending")}
        options={[
          { value: "yes", label: "Présent(e)s" },
          { value: "no", label: "Absent(e)s" },
        ]}
      />

      {form.attending === "yes" && (
        <div className="admin-form__row">
          <Stepper id="man-guests" label="Nombre de personnes (enfants inclus)" value={form.guests} min={1} max={20} onChange={set("guests")} />
          <Stepper id="man-children" label="Dont enfants" value={form.children} min={0} max={12} onChange={set("children")} />
        </div>
      )}

      <div className="field">
        <label htmlFor="man-dietary">Régime alimentaire / allergies</label>
        <input id="man-dietary" type="text" value={form.dietary} onChange={setEvt("dietary")} maxLength={200} placeholder="Optionnel" />
      </div>

      <div className="field">
        <label htmlFor="man-message">Note (optionnel)</label>
        <input
          id="man-message"
          type="text"
          value={form.message}
          onChange={setEvt("message")}
          maxLength={500}
          placeholder="Ex. : réponse par téléphone le 5 septembre"
        />
      </div>

      {error && <p className="rsvp__error">{error}</p>}

      <div className="admin-form__actions">
        <button type="submit" className="btn btn--gold" disabled={saving}>
          {saving ? "Enregistrement…" : initial ? "Enregistrer la correction" : "Ajouter la réponse"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* -------------------------------- dashboard ------------------------------- */
function ResponsesDashboard({ demo, onSignOut }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  // { open, editing }: editing = the row being corrected (null = new entry)
  const [manual, setManual] = useState({ open: false, editing: null });

  const load = useCallback(() => {
    return listResponses()
      .then((data) => setRows(data))
      .catch((e) => setError("Lecture impossible. " + (e?.message || "")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    setError("");
    setLoading(true);
    load();
  };

  const latest = useMemo(() => latestByEmail(rows), [rows]);
  const dupCount = useMemo(() => duplicateIds(rows).length, [rows]);
  const present = latest.filter((r) => r.attending === "yes");
  const absent = latest.filter((r) => r.attending === "no");
  const heads = present.reduce((s, r) => s + (Number(r.guests) || 0), 0);
  const kids = present.reduce((s, r) => s + (Number(r.children) || 0), 0);

  const downloadCsv = () => {
    const blob = new Blob(["﻿" + toCsv(latest)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp-mariage-dunkerque.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Shared delete runner: confirms, deletes the given ids, refreshes, and
  // reports how many rows were actually removed (0 => likely a missing DELETE
  // RLS policy, cf. supabase/schema.sql).
  const runDelete = useCallback(
    async (ids, confirmMsg, okMsg) => {
      if (!ids.length) return;
      if (!window.confirm(confirmMsg)) return;
      setError("");
      setNotice("");
      setBusy(true);
      try {
        const n = await deleteResponses(ids);
        await load();
        setNotice(
          n > 0
            ? okMsg(n)
            : "Aucune suppression effectuée : la policy DELETE n'est peut-être pas active (voir supabase/schema.sql).",
        );
      } catch (e) {
        setError("Suppression impossible. " + (e?.message || ""));
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const cleanDuplicates = () => {
    const ids = duplicateIds(rows);
    return runDelete(
      ids,
      `Supprimer ${ids.length} réponse(s) en doublon ? On garde la plus récente de chaque email.`,
      (n) => `${n} doublon(s) supprimé(s).`,
    );
  };

  const deleteRow = (row) => {
    const ids = idsForRow(rows, row);
    return runDelete(
      ids,
      `Supprimer la réponse de ${row.name || row.email} ?` +
        (ids.length > 1 ? ` (${ids.length} lignes, doublons compris)` : ""),
      () => `Réponse de ${row.name || row.email} supprimée.`,
    );
  };

  // Manual entry: insert a new row; when correcting, the previous row(s) of
  // that guest are then removed (there is no UPDATE policy, by design).
  const saveManual = async (form) => {
    const editing = manual.editing;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await addManualResponse({ ...form, variant: editing?.variant || "ceremonie" });
      let cleanupFailed = false;
      if (editing) {
        try {
          await deleteResponses(idsForRow(rows, editing));
        } catch {
          cleanupFailed = true;
        }
      }
      await load();
      setManual({ open: false, editing: null });
      const who = form.name.trim();
      setNotice(
        editing
          ? cleanupFailed
            ? `Réponse de ${who} enregistrée, mais l'ancienne ligne n'a pas pu être supprimée : supprimez-la à la main.`
            : `Réponse de ${who} mise à jour.`
          : `Réponse de ${who} ajoutée.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin__bar">
        <div className="admin-stats">
          <span className="admin-stat">
            <strong>{latest.length}</strong> réponses
          </span>
          <span className="admin-stat">
            <strong>{present.length}</strong> présents
          </span>
          <span className="admin-stat">
            <strong>{absent.length}</strong> absents
          </span>
          <span className="admin-stat">
            <strong>{heads}</strong> personnes attendues
          </span>
          <span className="admin-stat">
            <strong>{kids}</strong> enfants
          </span>
        </div>
        <div className="admin__actions">
          <button
            className="btn btn--gold"
            onClick={() => setManual((m) => (m.open ? { open: false, editing: null } : { open: true, editing: null }))}
            disabled={busy}
            title="Saisir la réponse d'un invité qui ne passe pas par le site"
          >
            {manual.open ? "Fermer le formulaire" : "+ Ajouter une réponse"}
          </button>
          <button className="btn btn--ghost" onClick={reload} disabled={loading || busy}>
            {loading ? "…" : "Rafraîchir"}
          </button>
          <button className="btn btn--ghost" onClick={downloadCsv} disabled={!latest.length}>
            Export CSV
          </button>
          <button
            className="btn btn--ghost"
            onClick={cleanDuplicates}
            disabled={busy || dupCount === 0}
            title="Supprimer les anciennes versions (garde la dernière réponse par email)"
          >
            {`Nettoyer les doublons${dupCount ? ` (${dupCount})` : ""}`}
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
          Mode démo (réponses locales à cet appareil) : connectez Supabase pour le suivi partagé et sécurisé.
        </p>
      )}

      {manual.open && (
        <div className="admin-panel">
          <h3 className="admin-panel__title">
            {manual.editing ? `Corriger la réponse de ${manual.editing.name || manual.editing.email}` : "Ajouter une réponse à la main"}
          </h3>
          <p className="admin-panel__hint">
            Pour les invités qui répondent par téléphone ou de vive voix. L'email est facultatif.
          </p>
          <ManualResponseForm
            key={manual.editing?.id || "new"}
            initial={manual.editing}
            onSubmit={saveManual}
            onCancel={() => setManual({ open: false, editing: null })}
          />
        </div>
      )}

      {loading && rows.length === 0 ? (
        <p className="admin__empty">Chargement…</p>
      ) : latest.length === 0 ? (
        <p className="admin__empty">Aucune réponse pour le moment.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Réponse</th>
                <th>Pers.</th>
                <th>Enfants</th>
                <th>Régime</th>
                <th>Message</th>
                <th>Variante</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r) => (
                <tr key={r.id} className={r.attending === "no" ? "is-absent" : "is-present"}>
                  <td>
                    <span className="admin-name">{r.name}</span>
                    <span className="admin-email">{r.email || "Sans email"}</span>
                    {r.source === "manual" && <span className="admin-tag">Saisie mariés</span>}
                  </td>
                  <td>{r.attending === "yes" ? "✓ Présent" : "✗ Absent"}</td>
                  <td>{r.attending === "yes" ? r.guests : "·"}</td>
                  <td>{r.attending === "yes" ? r.children || 0 : "·"}</td>
                  <td>{r.dietary || "·"}</td>
                  <td>{r.message || "·"}</td>
                  <td>{r.variant || "·"}</td>
                  <td className="admin-row-actions">
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => setManual({ open: true, editing: r })}
                      disabled={busy}
                      title={`Corriger la réponse de ${r.name || r.email}`}
                      aria-label={`Corriger la réponse de ${r.name || r.email}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="linklike linklike--danger"
                      onClick={() => deleteRow(r)}
                      disabled={busy}
                      title={`Supprimer la réponse de ${r.name || r.email}`}
                      aria-label={`Supprimer la réponse de ${r.name || r.email}`}
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

export default function AdminPage() {
  useEffect(() => {
    document.title = `Espace mariés · ${wedding.couple}`;
  }, []);

  return (
    <AdminGate title="Réponses">
      {({ demo, signOut }) => <ResponsesDashboard demo={demo} onSignOut={signOut} />}
    </AdminGate>
  );
}
