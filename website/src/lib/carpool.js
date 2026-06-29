// Carpool data layer.
// Uses Supabase when configured (shared, realtime). Otherwise falls back to a
// local per-device demo store so the UI still works before the DB is wired.
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const TABLE = "carpool_entries";
const LOCAL_KEY = "carpool-entries-demo";
const MINE_KEY = "carpool-mine"; // ids of entries created on THIS device (deletable)

export const carpoolMode = isSupabaseConfigured ? "supabase" : "local";

const MAX = { name: 60, area: 80, contact: 120, note: 200 };
export function sanitizeEntry(raw) {
  const type = raw.type === "seek" ? "seek" : "offer";
  return {
    type,
    name: String(raw.name || "").trim().slice(0, MAX.name),
    area: String(raw.area || "").trim().slice(0, MAX.area),
    contact: String(raw.contact || "").trim().slice(0, MAX.contact),
    seats: type === "offer" ? Math.max(1, Math.min(8, parseInt(raw.seats, 10) || 1)) : null,
    note: String(raw.note || "").trim().slice(0, MAX.note) || null,
    variant: raw.variant || null,
  };
}

/* --------------------------- local fallback ------------------------------ */
function localRead() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}
function localWrite(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/* ---------------------- ownership (deletable by me) ---------------------- */
function readMine() {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) || "[]");
  } catch {
    return [];
  }
}
function addMine(id) {
  if (!id) return;
  try {
    const s = readMine();
    if (!s.includes(id)) {
      s.push(id);
      localStorage.setItem(MINE_KEY, JSON.stringify(s));
    }
  } catch {
    /* ignore */
  }
}
function removeMine(id) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(readMine().filter((x) => x !== id)));
  } catch {
    /* ignore */
  }
}
export function getMyEntryIds() {
  return readMine();
}

/* ------------------------------ public API ------------------------------- */
export async function listEntries() {
  if (carpoolMode === "supabase") {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  return localRead();
}

export async function addEntry(raw) {
  const entry = sanitizeEntry(raw);
  if (!entry.name || !entry.area || !entry.contact) {
    throw new Error("missing-fields");
  }
  if (carpoolMode === "supabase") {
    const { data, error } = await supabase.from(TABLE).insert(entry).select().single();
    if (error) throw error;
    addMine(data.id);
    return data;
  }
  const list = localRead();
  const saved = {
    ...entry,
    id: `local-${Date.now()}-${list.length}`,
    created_at: new Date().toISOString(),
  };
  list.push(saved);
  localWrite(list);
  addMine(saved.id);
  window.dispatchEvent(new CustomEvent("carpool-local-change"));
  return saved;
}

export async function deleteEntry(id) {
  if (carpoolMode === "supabase") {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  } else {
    localWrite(localRead().filter((e) => e.id !== id));
    window.dispatchEvent(new CustomEvent("carpool-local-change"));
  }
  removeMine(id);
}

/**
 * Subscribe to live changes. Returns an unsubscribe function.
 * Supabase: postgres_changes on the table. Local: storage/custom events.
 */
export function subscribeEntries(onChange) {
  if (carpoolMode === "supabase") {
    const channel = supabase
      .channel("carpool-entries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        () => onChange(),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("carpool-local-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("carpool-local-change", handler);
  };
}
