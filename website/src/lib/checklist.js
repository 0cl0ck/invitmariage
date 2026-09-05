// Checklist data layer (espace mariés).
// Supabase when configured (table `checklist_items`, réservée aux mariés
// connectés, temps réel) ; sinon un magasin local (localStorage, par appareil)
// pour que la page fonctionne en mode démo.
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";
import { ASSIGNEES, DEFAULT_CATEGORY, TEMPLATE } from "../content/checklist.js";

const TABLE = "checklist_items";
const LOCAL_KEY = "checklist-items";
const LOCAL_EVENT = "checklist-local-change";

export const checklistMode = isSupabaseConfigured ? "supabase" : "local";

export const LIMITS = { title: 160, category: 60, notes: 1000 };
const ASSIGNEE_VALUES = ASSIGNEES.map((a) => a.value);

/* ------------------------------ sanitizing ------------------------------- */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(v) {
  return typeof v === "string" && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}

const FIELD = {
  title: (v) => String(v || "").trim().slice(0, LIMITS.title),
  category: (v) =>
    String(v || "").trim().replace(/\s+/g, " ").slice(0, LIMITS.category) || DEFAULT_CATEGORY,
  notes: (v) => String(v || "").trim().slice(0, LIMITS.notes) || null,
  assignee: (v) => (ASSIGNEE_VALUES.includes(v) ? v : null),
  due_date: (v) => (isIsoDate(v) ? v : null),
  done: (v) => Boolean(v),
  sort_order: (v) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0),
};

/** Full row (every field normalized). Throws on empty title. */
export function sanitizeItem(raw) {
  const out = {};
  for (const key of Object.keys(FIELD)) out[key] = FIELD[key](raw?.[key]);
  if (!out.title) throw new Error("missing-title");
  return out;
}

/** Partial row: only the keys present in `raw` are kept (and normalized). */
export function sanitizePatch(raw) {
  const out = {};
  for (const key of Object.keys(FIELD)) {
    if (raw && Object.prototype.hasOwnProperty.call(raw, key)) out[key] = FIELD[key](raw[key]);
  }
  if ("title" in out && !out.title) throw new Error("missing-title");
  return out;
}

/* ---------------------------- local fallback ----------------------------- */
function localRead() {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function localWrite(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* ignore (quota, private mode) */
  }
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT));
}
let localSeq = 0;
function localId() {
  localSeq += 1;
  return `local-${Date.now()}-${localSeq}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------ public API ------------------------------- */
export async function listItems() {
  if (checklistMode === "supabase") {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  return sortItems(localRead());
}

/** Insert several items at once (used by the template). Returns saved rows. */
export async function addItems(raws) {
  const entries = raws.map(sanitizeItem);
  if (!entries.length) return [];
  if (checklistMode === "supabase") {
    const { data, error } = await supabase.from(TABLE).insert(entries).select();
    if (error) throw error;
    return data || [];
  }
  const now = new Date().toISOString();
  const saved = entries.map((e) => ({ ...e, id: localId(), created_at: now, updated_at: now }));
  localWrite([...localRead(), ...saved]);
  return saved;
}

export async function addItem(raw) {
  const [saved] = await addItems([raw]);
  return saved;
}

/** Update one item. `patch` may contain any subset of the editable fields. */
export async function updateItem(id, patch) {
  return updateMany([{ id, patch }]);
}

/** Update several items ([{ id, patch }]). Runs in parallel in Supabase mode. */
export async function updateMany(changes) {
  const list = (changes || []).filter((c) => c && c.id);
  if (!list.length) return;
  const updated_at = new Date().toISOString();
  if (checklistMode === "supabase") {
    const results = await Promise.all(
      list.map(({ id, patch }) =>
        supabase
          .from(TABLE)
          .update({ ...sanitizePatch(patch), updated_at })
          .eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
    return;
  }
  const byId = new Map(list.map(({ id, patch }) => [id, sanitizePatch(patch)]));
  localWrite(
    localRead().map((row) => (byId.has(row.id) ? { ...row, ...byId.get(row.id), updated_at } : row)),
  );
}

export async function deleteItems(ids) {
  const list = [...new Set(ids || [])].filter(Boolean);
  if (!list.length) return;
  if (checklistMode === "supabase") {
    const { error } = await supabase.from(TABLE).delete().in("id", list);
    if (error) throw error;
    return;
  }
  const set = new Set(list);
  localWrite(localRead().filter((row) => !set.has(row.id)));
}

/**
 * Subscribe to live changes. Returns an unsubscribe function.
 * Supabase: postgres_changes on the table (the mariés see each other's edits).
 * Local: storage/custom events (other tabs of the same browser).
 */
export function subscribeItems(onChange) {
  if (checklistMode === "supabase") {
    const channel = supabase
      .channel("checklist-items")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => onChange())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(LOCAL_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(LOCAL_EVENT, handler);
  };
}

/* ------------------------------ pure helpers ----------------------------- */

/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function todayIso(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Add `days` to an ISO date (calendar arithmetic, no DST surprises). */
export function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return todayIso(new Date(y, m - 1, d + days));
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso, toIso) {
  const p = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(toIso) - p(fromIso)) / 86400000);
}

/** "12 sept." style label for a YYYY-MM-DD date. */
export function formatDue(iso) {
  if (!isIsoDate(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** "none" | "done" | "overdue" | "today" | "soon" (≤ 7 j) | "later" */
export function dueStatus(item, today = todayIso()) {
  if (item.done) return "done";
  if (!isIsoDate(item.due_date)) return "none";
  const diff = daysBetween(today, item.due_date);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "soon";
  return "later";
}

/** Stable display order: sort_order, then creation time, then id. */
export function sortItems(items) {
  return [...items].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      String(a.created_at || "").localeCompare(String(b.created_at || "")) ||
      String(a.id).localeCompare(String(b.id)),
  );
}

/**
 * Group sorted items by category. Categories are ordered by the smallest
 * sort_order of their items (then by first appearance), so both items and
 * category blocks can be reordered through `sort_order` alone.
 */
export function groupByCategory(items) {
  const groups = new Map();
  for (const item of sortItems(items)) {
    const name = item.category || DEFAULT_CATEGORY;
    if (!groups.has(name)) groups.set(name, { name, items: [] });
    groups.get(name).items.push(item);
  }
  return [...groups.values()];
}

/**
 * Renumber sort_order sequentially in the given grouped order. Returns only
 * the rows whose value changes ([{ id, patch: { sort_order } }]).
 */
export function reorderChanges(groups) {
  const changes = [];
  let index = 0;
  for (const g of groups) {
    for (const item of g.items) {
      if ((item.sort_order ?? 0) !== index) changes.push({ id: item.id, patch: { sort_order: index } });
      index += 1;
    }
  }
  return changes;
}

function swap(list, i, j) {
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** Move an item one step up (-1) or down (+1) inside its category. */
export function moveItem(groups, itemId, dir) {
  return groups.map((g) => {
    const i = g.items.findIndex((it) => it.id === itemId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= g.items.length) return g;
    return { ...g, items: swap(g.items, i, j) };
  });
}

/** Move a whole category block one step up (-1) or down (+1). */
export function moveCategory(groups, name, dir) {
  const i = groups.findIndex((g) => g.name === name);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= groups.length) return groups;
  return swap(groups, i, j);
}

/** sort_order to append a new item at the end of `category` (or of the list). */
export function nextSortOrder(items, category) {
  const inCat = items.filter((it) => (it.category || DEFAULT_CATEGORY) === category);
  const pool = inCat.length ? inCat : items;
  if (!pool.length) return 0;
  return Math.max(...pool.map((it) => it.sort_order ?? 0)) + 1;
}

/* ------------------------------ template --------------------------------- */
const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Template rows not yet present (matched on the title only, so renaming or
 * moving a task to another category never brings it back), with due dates
 * computed from the wedding date and sort_order appended after existing rows.
 */
export function missingTemplateItems(existing, weddingDateIso) {
  const have = new Set(existing.map((it) => norm(it.title)));
  let order = existing.length ? Math.max(...existing.map((it) => it.sort_order ?? 0)) + 1 : 0;
  const rows = [];
  for (const t of TEMPLATE) {
    if (have.has(norm(t.title))) continue;
    let due_date = null;
    if (isIsoDate(t.dueDate)) due_date = t.dueDate;
    else if (Number.isFinite(t.due) && isIsoDate(weddingDateIso)) due_date = addDays(weddingDateIso, -t.due);
    rows.push({
      title: t.title,
      category: t.category,
      notes: t.notes || null,
      assignee: t.assignee || null,
      due_date,
      done: false,
      sort_order: order,
    });
    order += 1;
  }
  return rows;
}
