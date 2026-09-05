// RSVP data layer.
// Insert-only (a correction = a new row); the admin dashboard keeps the latest
// row per email. Uses Supabase when configured, else a local demo store.
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const TABLE = "rsvp_responses";
const LOCAL_KEY = "rsvp-responses"; // all submissions (admin/local view)
const MINE_KEY = "rsvp-mine"; // this device's last submission (prefill / correction)

export const rsvpMode = isSupabaseConfigured ? "supabase" : "local";

function sanitize(raw) {
  const attending = raw.attending === "no" ? "no" : "yes";
  return {
    variant: raw.variant || null,
    name: String(raw.name || "").trim().slice(0, 80),
    email: String(raw.email || "").trim().slice(0, 120) || null,
    attending,
    guests: attending === "no" ? 0 : Math.max(0, Math.min(20, parseInt(raw.guests, 10) || 1)),
    children: Math.max(0, Math.min(12, parseInt(raw.children, 10) || 0)),
    dietary: String(raw.dietary || "").trim().slice(0, 200) || null,
    message: String(raw.message || "").trim().slice(0, 500) || null,
  };
}

/** Last response saved from THIS device (for prefill / correction). */
export function getMyResponse() {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) || "null");
  } catch {
    return null;
  }
}
function saveMine(entry) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify({ ...entry, savedAt: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}

/** Submit (or correct) a response. Returns the saved row. */
export async function submitResponse(raw) {
  const entry = sanitize(raw);
  if (!entry.name || !entry.email || !entry.attending) {
    throw new Error("missing-fields");
  }
  if (rsvpMode === "supabase") {
    // IMPORTANT: do NOT chain .select() here. Reading the row back is reserved
    // to authenticated mariés (RLS), so a guest insert + read-back would fail
    // with "new row violates row-level security policy". Insert only.
    const { error } = await supabase.from(TABLE).insert(entry);
    if (error) throw error;
    saveMine(entry);
    return entry;
  }
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  const saved = { ...entry, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
  list.push(saved);
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  saveMine(entry);
  return saved;
}

/* ------------------------- manual entry (mariés) ------------------------- */

/**
 * Add (from /espace-maries) the answer of a guest who cannot use the site.
 * Email is optional; the row is flagged `source = 'manual'` (requires the
 * migration in supabase/schema.sql §5). Never touches this device's own RSVP.
 */
export async function addManualResponse(raw) {
  const entry = { ...sanitize(raw), source: "manual" };
  if (!entry.name) throw new Error("missing-fields");
  if (entry.email && entry.email.length < 3) throw new Error("bad-email");
  if (rsvpMode === "supabase") {
    const { error } = await supabase.from(TABLE).insert(entry);
    if (error) throw error;
    return entry;
  }
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  const saved = { ...entry, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
  list.push(saved);
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return saved;
}

/* ------------------------------ admin side ------------------------------- */

/** All rows (requires an authenticated session in Supabase mode). */
export async function listResponses() {
  if (rsvpMode === "supabase") {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]")
    .slice()
    .reverse();
}

/** Grouping key: the email when there is one, else the row itself (no email = no correction chain). */
export function rowKey(r) {
  const email = (r.email || "").toLowerCase().trim();
  return email ? `email:${email}` : `id:${r.id}`;
}

/** Keep only the most recent row per email (a correction supersedes earlier ones). */
export function latestByEmail(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = rowKey(r);
    const prev = map.get(key);
    if (!prev || new Date(r.created_at) > new Date(prev.created_at)) map.set(key, r);
  }
  return [...map.values()];
}

/** IDs of superseded rows: everything except the latest row of each email. */
export function duplicateIds(rows) {
  const keep = new Set(latestByEmail(rows).map((r) => r.id));
  return rows.filter((r) => !keep.has(r.id)).map((r) => r.id);
}

/** IDs of every row belonging to the same guest as `row` (used to fully remove or replace one guest). */
export function idsForRow(rows, row) {
  const key = rowKey(row);
  return rows.filter((r) => rowKey(r) === key).map((r) => r.id);
}

/**
 * Delete rows by id (mariés only in Supabase mode). Returns how many rows were
 * actually removed — 0 with no error usually means the DELETE RLS policy is
 * missing (see supabase/schema.sql).
 */
export async function deleteResponses(ids) {
  const list0 = [...new Set(ids || [])].filter(Boolean);
  if (!list0.length) return 0;
  if (rsvpMode === "supabase") {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .in("id", list0)
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  }
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  const idSet = new Set(list0);
  const kept = list.filter((r) => !idSet.has(r.id));
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(kept));
  } catch {
    /* ignore */
  }
  return list.length - kept.length;
}
