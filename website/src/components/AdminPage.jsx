import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";
import {
  listResponses,
  latestByEmail,
  duplicateIds,
  idsForEmail,
  deleteResponses,
  rsvpMode,
} from "../lib/rsvp.js";
import { wedding } from "../content/variants.js";

function Shell({ children }) {
  return (
    <div className="admin">
      <div className="admin__inner">
        <header className="admin__head">
          <span className="topbar__monogram">{wedding.monogram}</span>
          <span className="admin__title">Espace mariés — réponses</span>
        </header>
        {children}
      </div>
    </div>
  );
}

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
    ["created_at", "Date"],
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = cols.map(([, label]) => esc(label)).join(",");
  const body = rows
    .map((r) => cols.map(([key]) => esc(r[key])).join(","))
    .join("\n");
  return head + "\n" + body;
}

function Dashboard({ rows, onRefresh, loading, onSignOut, demo, onCleanDuplicates, onDeleteRow, notice, busy }) {
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
          <button className="btn btn--ghost" onClick={onRefresh} disabled={loading || busy}>
            {loading ? "…" : "Rafraîchir"}
          </button>
          <button className="btn btn--ghost" onClick={downloadCsv} disabled={!latest.length}>
            Export CSV
          </button>
          <button
            className="btn btn--ghost"
            onClick={onCleanDuplicates}
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

      {notice && <p className="admin__notice">{notice}</p>}

      {demo && (
        <p className="carpool__demo">
          Mode démo (réponses locales à cet appareil) — connectez Supabase pour le
          suivi partagé et sécurisé.
        </p>
      )}

      {latest.length === 0 ? (
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
                    <span className="admin-email">{r.email}</span>
                  </td>
                  <td>{r.attending === "yes" ? "✓ Présent" : "✗ Absent"}</td>
                  <td>{r.attending === "yes" ? r.guests : "—"}</td>
                  <td>{r.attending === "yes" ? r.children || 0 : "—"}</td>
                  <td>{r.dietary || "—"}</td>
                  <td>{r.message || "—"}</td>
                  <td>{r.variant || "—"}</td>
                  <td className="admin-row-actions">
                    <button
                      type="button"
                      className="linklike linklike--danger"
                      onClick={() => onDeleteRow(r)}
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
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [signingIn, setSigningIn] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Espace mariés — Hugo & Laura";
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await listResponses());
    } catch (e) {
      setError("Lecture impossible. " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rsvpMode === "local") {
      load();
      return;
    }
    if (session) load();
  }, [session, load]);

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
            : "Aucune suppression effectuée — la policy DELETE n'est peut-être pas active (voir supabase/schema.sql).",
        );
      } catch (e) {
        setError("Suppression impossible. " + (e?.message || ""));
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const cleanDuplicates = useCallback(() => {
    const ids = duplicateIds(rows);
    return runDelete(
      ids,
      `Supprimer ${ids.length} réponse(s) en doublon ? On garde la plus récente de chaque email.`,
      (n) => `${n} doublon(s) supprimé(s).`,
    );
  }, [rows, runDelete]);

  const deleteRow = useCallback(
    (row) => {
      const ids = idsForEmail(rows, row.email);
      return runDelete(
        ids,
        `Supprimer la réponse de ${row.name || row.email} ?` +
          (ids.length > 1 ? ` (${ids.length} lignes, doublons compris)` : ""),
        () => `Réponse de ${row.name || row.email} supprimée.`,
      );
    },
    [rows, runDelete],
  );

  const signIn = async (e) => {
    e.preventDefault();
    setError("");
    setSigningIn(true);
    const { error: err } = await supabase.auth.signInWithPassword(creds);
    if (err) setError("Connexion échouée : " + err.message);
    setSigningIn(false);
  };

  // Local demo mode: no auth needed.
  if (rsvpMode === "local") {
    return (
      <Shell>
        {error && <p className="rsvp__error">{error}</p>}
        <Dashboard
          rows={rows}
          onRefresh={load}
          loading={loading}
          demo
          onSignOut={() => {}}
          onCleanDuplicates={cleanDuplicates}
          onDeleteRow={deleteRow}
          notice={notice}
          busy={busy}
        />
      </Shell>
    );
  }

  if (!authReady) {
    return (
      <Shell>
        <p className="admin__empty">Chargement…</p>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <form className="admin-login" onSubmit={signIn}>
          <p className="rsvp__intro">Connexion réservée aux mariés.</p>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={creds.email}
              onChange={(e) => setCreds((c) => ({ ...c, email: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-pass">Mot de passe</label>
            <input
              id="admin-pass"
              type="password"
              value={creds.password}
              onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
              required
            />
          </div>
          {error && <p className="rsvp__error">{error}</p>}
          <button className="btn btn--gold" type="submit" disabled={signingIn}>
            {signingIn ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      {error && <p className="rsvp__error">{error}</p>}
      <Dashboard
        rows={rows}
        onRefresh={load}
        loading={loading}
        onSignOut={() => supabase.auth.signOut()}
        onCleanDuplicates={cleanDuplicates}
        onDeleteRow={deleteRow}
        notice={notice}
        busy={busy}
      />
    </Shell>
  );
}
