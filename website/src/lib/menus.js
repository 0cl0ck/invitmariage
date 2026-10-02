// Menu choices data layer.
// Guests go through /api/menu (service role on the server, token in the URL).
// Mariés read/write the tables directly (RLS: authenticated only), send the
// request emails through /api/menu-send and choose on a guest's behalf through
// /api/menu-admin. Without Supabase: local demo store.
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

export const menuMode = isSupabaseConfigured ? "supabase" : "local";

/* ------------------------------ demo store ------------------------------- */
const DEMO_KEY = "menu-demo";
const DEMO_TOKEN = "0".repeat(32); // /menu/000…0 always works in demo mode

function demoLoad() {
  let db;
  try {
    db = JSON.parse(localStorage.getItem(DEMO_KEY) || "null");
  } catch {
    db = null;
  }
  if (!db) {
    db = {
      households: [
        { id: "demo-1", token: DEMO_TOKEN, name: "Famille Démo", email: "demo@example.com", lang: "fr", adults: 2, children: 1, rsvp_id: null, created_at: new Date().toISOString(), request_sent_at: null, confirmed_at: null, confirmation_sent_at: null },
      ],
      choices: [],
    };
  }
  return db;
}
function demoSave(db) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}
function newToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

/* --------------------------------- guest --------------------------------- */
export class MenuError extends Error {
  constructor(code, extra = {}) {
    super(code);
    this.code = code;
    Object.assign(this, extra);
  }
}

async function api(path, options) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new MenuError(body.error || "server", body);
  return body;
}

/** { household, choices } for a guest link. */
export async function fetchMenu(token) {
  if (menuMode === "local") {
    const db = demoLoad();
    const h = db.households.find((x) => x.token === token);
    if (!h) throw new MenuError("not-found");
    demoSave(db);
    return {
      household: { name: h.name, email: h.email, lang: h.lang, adults: h.adults, children: h.children, confirmedAt: h.confirmed_at, confirmationSent: Boolean(h.confirmed_at && h.email) },
      choices: db.choices.filter((c) => c.household_id === h.id),
    };
  }
  return api(`/api/menu?token=${encodeURIComponent(token)}`);
}

/** Final confirmation. Throws MenuError(code): already-confirmed, invalid… */
export async function confirmMenu(token, choices) {
  if (menuMode === "local") {
    const db = demoLoad();
    const h = db.households.find((x) => x.token === token);
    if (!h) throw new MenuError("not-found");
    if (h.confirmed_at) throw new MenuError("already-confirmed");
    db.choices.push(...choices.map((c, i) => ({ ...c, starter: c.starter || null, household_id: h.id, position: i })));
    h.confirmed_at = new Date().toISOString();
    demoSave(db);
    return { household: { ...h, confirmedAt: h.confirmed_at, confirmationSent: Boolean(h.email) }, choices };
  }
  return api("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, choices }),
  });
}

/* --------------------------------- mariés -------------------------------- */

/** Households with their confirmed choices attached (`choices` array). */
export async function listHouseholds() {
  if (menuMode === "local") {
    const db = demoLoad();
    demoSave(db);
    return db.households.map((h) => ({
      ...h,
      choices: db.choices.filter((c) => c.household_id === h.id).sort((a, b) => a.position - b.position),
    }));
  }
  const [{ data: hs, error: e1 }, { data: cs, error: e2 }] = await Promise.all([
    supabase.from("menu_households").select("*").order("created_at"),
    supabase.from("menu_choices").select("*").order("position"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return (hs || []).map((h) => ({ ...h, choices: (cs || []).filter((c) => c.household_id === h.id) }));
}

/** rows: [{ rsvp_id, name, email, adults, children }] */
export async function createHouseholds(rows) {
  if (!rows.length) return;
  if (menuMode === "local") {
    const db = demoLoad();
    for (const r of rows) {
      db.households.push({ ...r, id: `local-${newToken()}`, token: newToken(), lang: "fr", created_at: new Date().toISOString(), request_sent_at: null, confirmed_at: null, confirmation_sent_at: null });
    }
    demoSave(db);
    return;
  }
  // One by one: a link already created meanwhile (unique rsvp_id) is skipped.
  let created = 0;
  for (const row of rows) {
    const { error } = await supabase.from("menu_households").insert(row);
    if (error && error.code !== "23505") throw error;
    if (!error) created += 1;
  }
  return created;
}

const EDITABLE = ["name", "email", "lang", "adults", "children"];

/** patch: any of { name, email, lang, adults, children }; other keys are dropped. */
export async function updateHousehold(id, rawPatch) {
  const patch = Object.fromEntries(Object.entries(rawPatch).filter(([k]) => EDITABLE.includes(k)));
  if (menuMode === "local") {
    const db = demoLoad();
    Object.assign(db.households.find((h) => h.id === id) || {}, patch);
    demoSave(db);
    return;
  }
  const { error } = await supabase.from("menu_households").update(patch).eq("id", id);
  if (error) throw error;
}

/** Unlock a confirmed household: its choices are erased and the link works again. */
export async function reopenHousehold(id) {
  if (menuMode === "local") {
    const db = demoLoad();
    db.choices = db.choices.filter((c) => c.household_id !== id);
    Object.assign(db.households.find((h) => h.id === id) || {}, { confirmed_at: null, confirmation_sent_at: null });
    demoSave(db);
    return;
  }
  // Unlock first: an unconfirmed household's leftover choices count for nothing
  // (totals only count confirmed ones) and confirm_menu() replaces them.
  const { error: e1 } = await supabase
    .from("menu_households")
    .update({ confirmed_at: null, confirmation_sent_at: null })
    .eq("id", id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("menu_choices").delete().eq("household_id", id);
  if (e2) throw e2;
}

export async function deleteHousehold(id) {
  if (menuMode === "local") {
    const db = demoLoad();
    db.households = db.households.filter((h) => h.id !== id);
    db.choices = db.choices.filter((c) => c.household_id !== id);
    demoSave(db);
    return;
  }
  const { error } = await supabase.from("menu_households").delete().eq("id", id);
  if (error) throw error;
}

/** Email the menu request. Returns { sent, skipped }. */
export async function sendRequests(ids) {
  if (menuMode === "local") {
    const db = demoLoad();
    let sent = 0;
    for (const h of db.households) {
      if (ids.includes(h.id) && h.email && !h.confirmed_at) {
        h.request_sent_at = new Date().toISOString();
        sent += 1;
      }
    }
    demoSave(db);
    return { sent, skipped: ids.length - sent };
  }
  const { data } = await supabase.auth.getSession();
  return api("/api/menu-send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
    body: JSON.stringify({ ids }),
  });
}

/** Mariés choose (or change) a household's menus on its behalf: saved and
 *  confirmed, no email to the guest. Throws MenuError(code): invalid… */
export async function chooseForHousehold(id, choices) {
  if (menuMode === "local") {
    const db = demoLoad();
    const h = db.households.find((x) => x.id === id);
    if (!h) throw new MenuError("not-found");
    db.choices = db.choices.filter((c) => c.household_id !== id);
    db.choices.push(...choices.map((c, i) => ({ ...c, starter: c.starter || null, household_id: id, position: i })));
    Object.assign(h, { confirmed_at: new Date().toISOString(), confirmation_sent_at: null });
    demoSave(db);
    return;
  }
  const { data } = await supabase.auth.getSession();
  return api("/api/menu-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
    body: JSON.stringify({ id, choices }),
  });
}

export function menuUrl(h) {
  return `${window.location.origin}/menu/${h.token}${h.lang === "es" ? "?lang=es" : ""}`;
}
