// Coquille + garde d'authentification partagées par les pages de /espace-maries.
// (composants uniquement ; le hook de session vit dans lib/adminAuth.js)
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../lib/adminAuth.js";
import { wedding } from "../content/variants.js";

const NAV = [
  { to: "/espace-maries", label: "Réponses", end: true },
  { to: "/espace-maries/menus", label: "Menus" },
  { to: "/espace-maries/checklist", label: "Checklist" },
];

export function AdminShell({ title, children }) {
  return (
    <div className="admin">
      <div className="admin__inner">
        <header className="admin__head">
          <span className="topbar__monogram">{wedding.monogram}</span>
          <span className="admin__title">Espace mariés · {title}</span>
          <nav className="admin-nav" aria-label="Pages de l'espace mariés">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => "admin-nav__link" + (isActive ? " is-active" : "")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

function LoginForm({ onSignIn }) {
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSigningIn(true);
    try {
      await onSignIn(creds);
    } catch (err) {
      setError("Connexion échouée : " + (err?.message || ""));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <p className="rsvp__intro">Connexion réservée aux mariés.</p>
      <div className="field">
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
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
          autoComplete="current-password"
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
  );
}

/**
 * Renders `children` (a node, or a function receiving { demo, signOut }) only
 * for the mariés: Supabase session required, or demo mode when Supabase is
 * not configured.
 */
export function AdminGate({ title, children }) {
  const { session, authReady, demo, signIn, signOut } = useAdminAuth();

  let body;
  if (demo || session) {
    body = typeof children === "function" ? children({ demo, signOut }) : children;
  } else if (!authReady) {
    body = <p className="admin__empty">Chargement…</p>;
  } else {
    body = <LoginForm onSignIn={signIn} />;
  }

  return <AdminShell title={title}>{body}</AdminShell>;
}
