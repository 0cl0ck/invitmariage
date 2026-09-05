// Checklist de mariage des mariés : /espace-maries/checklist
// Tâches par catégorie, cochables, modifiables à souhait (titre, catégorie,
// échéance, responsable, notes, ordre), partagées en temps réel entre les
// mariés (Supabase) ou en mode démo local.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminGate } from "./AdminShell.jsx";
import { ButtonGroup } from "./FormControls.jsx";
import { wedding } from "../content/variants.js";
import {
  ASSIGNEES,
  DEFAULT_CATEGORY,
  SUGGESTED_CATEGORIES,
  TEMPLATE,
  assigneeLabel,
} from "../content/checklist.js";
import {
  LIMITS,
  checklistMode,
  listItems,
  addItem,
  addItems,
  updateItem,
  updateMany,
  deleteItems,
  subscribeItems,
  todayIso,
  daysBetween,
  formatDue,
  dueStatus,
  groupByCategory,
  reorderChanges,
  moveItem,
  moveCategory,
  nextSortOrder,
  missingTemplateItems,
} from "../lib/checklist.js";

const STATUS_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "todo", label: "À faire" },
  { value: "done", label: "Faites" },
];

const ASSIGNEE_OPTIONS = [{ value: "", label: "Non attribué" }, ...ASSIGNEES];

function IconButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      className={"cl-iconbtn" + (danger ? " cl-iconbtn--danger" : "")}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function dueLabel(item, status) {
  const date = formatDue(item.due_date);
  if (status === "overdue") return `En retard · ${date}`;
  if (status === "today") return "Aujourd'hui";
  return date;
}

/* ------------------------------ item form -------------------------------- */
function ItemForm({ initial, submitLabel, onSubmit, onCancel, idPrefix, autoFocus }) {
  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    category: initial?.category || DEFAULT_CATEGORY,
    due_date: initial?.due_date || "",
    assignee: initial?.assignee || "",
    notes: initial?.notes || "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setEvt = (key) => (e) => set(key)(e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Merci d'indiquer l'intitulé de la tâche.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: form.title,
        category: form.category.trim() || DEFAULT_CATEGORY,
        due_date: form.due_date || null,
        assignee: form.assignee || null,
        notes: form.notes,
      });
    } catch (err) {
      setError("Enregistrement impossible. " + (err?.message || ""));
      setSaving(false);
    }
  };

  return (
    <form className="cl-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`${idPrefix}-title`}>Tâche*</label>
        <input
          id={`${idPrefix}-title`}
          type="text"
          value={form.title}
          onChange={setEvt("title")}
          maxLength={LIMITS.title}
          autoFocus={autoFocus}
        />
      </div>
      <div className="cl-form__row">
        <div className="field">
          <label htmlFor={`${idPrefix}-category`}>Catégorie</label>
          <input
            id={`${idPrefix}-category`}
            type="text"
            list="cl-categories"
            value={form.category}
            onChange={setEvt("category")}
            maxLength={LIMITS.category}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-due`}>Échéance</label>
          <input
            id={`${idPrefix}-due`}
            type="date"
            value={form.due_date}
            onChange={setEvt("due_date")}
          />
        </div>
      </div>
      <ButtonGroup
        legend="Qui s'en occupe ?"
        value={form.assignee}
        options={ASSIGNEE_OPTIONS}
        onChange={set("assignee")}
      />
      <div className="field">
        <label htmlFor={`${idPrefix}-notes`}>Notes (optionnel)</label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={2}
          value={form.notes}
          onChange={setEvt("notes")}
          maxLength={LIMITS.notes}
        />
      </div>
      {error && <p className="rsvp__error">{error}</p>}
      <div className="cl-form__actions">
        <button type="submit" className="btn btn--gold" disabled={saving}>
          {saving ? "Enregistrement…" : submitLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* -------------------------------- item row -------------------------------- */
function ItemRow({ item, today, canMove, isFirst, isLast, busy, onToggle, onEdit, onDelete, onMove }) {
  const status = dueStatus(item, today);
  const checkId = `cl-check-${item.id}`;
  return (
    <li className={"cl-item" + (item.done ? " is-done" : "") + ` cl-item--${status}`}>
      <input
        id={checkId}
        type="checkbox"
        className="cl-check"
        checked={Boolean(item.done)}
        onChange={() => onToggle(item)}
        aria-label={`${item.done ? "Rouvrir" : "Marquer comme faite"} : ${item.title}`}
      />
      <div className="cl-item__main">
        <label htmlFor={checkId} className="cl-item__title">
          {item.title}
        </label>
        {(item.assignee || item.due_date) && (
          <div className="cl-item__meta">
            {item.assignee && <span className="cl-chip cl-chip--who">{assigneeLabel(item.assignee)}</span>}
            {item.due_date && (
              <span className={`cl-chip cl-chip--due is-${status}`}>{dueLabel(item, status)}</span>
            )}
          </div>
        )}
        {item.notes && <p className="cl-item__notes">{item.notes}</p>}
      </div>
      <div className="cl-item__actions">
        <IconButton label="Monter" onClick={() => onMove(item, -1)} disabled={busy || !canMove || isFirst}>
          ↑
        </IconButton>
        <IconButton label="Descendre" onClick={() => onMove(item, 1)} disabled={busy || !canMove || isLast}>
          ↓
        </IconButton>
        <IconButton label={`Modifier : ${item.title}`} onClick={() => onEdit(item)} disabled={busy}>
          ✎
        </IconButton>
        <IconButton label={`Supprimer : ${item.title}`} onClick={() => onDelete(item)} disabled={busy} danger>
          ✕
        </IconButton>
      </div>
    </li>
  );
}

/* ------------------------------ category block ---------------------------- */
function CategorySection({
  group,
  visibleItems,
  today,
  canMove,
  isFirst,
  isLast,
  busy,
  editingId,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onMoveItem,
  onQuickAdd,
  onRename,
  onDeleteCategory,
  onMoveCategory,
}) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [quick, setQuick] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const quickRef = useRef(null);

  const total = group.items.length;
  const done = group.items.filter((it) => it.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const slug = group.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  const submitRename = async (e) => {
    e.preventDefault();
    const name = newName.trim().replace(/\s+/g, " ");
    if (!name || name === group.name) {
      setRenaming(false);
      setNewName(group.name);
      return;
    }
    await onRename(group, name);
    setRenaming(false);
  };

  const submitQuick = async (e) => {
    e.preventDefault();
    if (!quick.trim()) return;
    setQuickSaving(true);
    try {
      await onQuickAdd(group.name, quick);
      setQuick("");
      quickRef.current?.focus();
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <section className="cl-cat" aria-labelledby={`cl-cat-${slug}`}>
      <header className="cl-cat__head">
        {renaming ? (
          <form className="cl-cat__rename" onSubmit={submitRename}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={LIMITS.category}
              aria-label="Nouveau nom de la catégorie"
              autoFocus
            />
            <button type="submit" className="btn btn--gold" disabled={busy}>
              OK
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setRenaming(false);
                setNewName(group.name);
              }}
            >
              Annuler
            </button>
          </form>
        ) : (
          <h3 className="cl-cat__title" id={`cl-cat-${slug}`}>
            {group.name}
            <span className="cl-cat__count">
              {done}/{total}
            </span>
          </h3>
        )}
        <div className="cl-cat__actions">
          <IconButton label={`Monter la catégorie ${group.name}`} onClick={() => onMoveCategory(group, -1)} disabled={busy || !canMove || isFirst}>
            ↑
          </IconButton>
          <IconButton label={`Descendre la catégorie ${group.name}`} onClick={() => onMoveCategory(group, 1)} disabled={busy || !canMove || isLast}>
            ↓
          </IconButton>
          <IconButton label={`Renommer la catégorie ${group.name}`} onClick={() => setRenaming(true)} disabled={busy || renaming}>
            ✎
          </IconButton>
          <IconButton label={`Supprimer la catégorie ${group.name} et ses tâches`} onClick={() => onDeleteCategory(group)} disabled={busy} danger>
            ✕
          </IconButton>
        </div>
      </header>
      <div className="cl-progress cl-progress--cat" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${group.name} : ${pct} % fait`}>
        <span style={{ width: `${pct}%` }} />
      </div>

      {visibleItems.length === 0 ? (
        <p className="cl-cat__empty">Aucune tâche ne correspond aux filtres.</p>
      ) : (
        <ul className="cl-list">
          {visibleItems.map((item, i) =>
            editingId === item.id ? (
              <li key={item.id} className="cl-item cl-item--editing">
                <ItemForm
                  initial={item}
                  submitLabel="Enregistrer"
                  idPrefix={`cl-edit-${item.id}`}
                  onSubmit={(values) => onSaveEdit(item, values)}
                  onCancel={onCancelEdit}
                  autoFocus
                />
              </li>
            ) : (
              <ItemRow
                key={item.id}
                item={item}
                today={today}
                canMove={canMove}
                isFirst={i === 0}
                isLast={i === visibleItems.length - 1}
                busy={busy}
                onToggle={onToggle}
                onEdit={onStartEdit}
                onDelete={onDelete}
                onMove={onMoveItem}
              />
            ),
          )}
        </ul>
      )}

      <form className="cl-quick" onSubmit={submitQuick}>
        <input
          ref={quickRef}
          type="text"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder={`Nouvelle tâche dans « ${group.name} »…`}
          aria-label={`Nouvelle tâche dans ${group.name}`}
          maxLength={LIMITS.title}
          disabled={quickSaving}
        />
        <button type="submit" className="btn btn--ghost" disabled={quickSaving || !quick.trim()}>
          Ajouter
        </button>
      </form>
    </section>
  );
}

/* --------------------------------- board ---------------------------------- */
function ChecklistBoard({ demo, onSignOut }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState({ status: "all", assignee: "all", q: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const today = todayIso();

  const refresh = useCallback(() => {
    return listItems()
      .then((rows) => {
        setItems(rows);
        setStatus("ready");
      })
      .catch((e) => {
        setStatus("error");
        setError("Lecture impossible. " + (e?.message || ""));
      });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeItems(refresh);
  }, [refresh]);

  // Apply a set of [{ id, patch }] locally right away (optimistic UI).
  const applyLocal = useCallback((changes) => {
    const map = new Map(changes.map((c) => [c.id, c.patch]));
    setItems((prev) => prev.map((it) => (map.has(it.id) ? { ...it, ...map.get(it.id) } : it)));
  }, []);

  // Run an action, then reload; on failure show the error and resync.
  const run = useCallback(
    async (action, { lock = true } = {}) => {
      setError("");
      setNotice("");
      if (lock) setBusy(true);
      try {
        const result = await action();
        await refresh();
        return result;
      } catch (e) {
        setError("Action impossible. " + (e?.message || ""));
        await refresh();
        throw e;
      } finally {
        if (lock) setBusy(false);
      }
    },
    [refresh],
  );

  const groups = useMemo(() => groupByCategory(items), [items]);
  const categories = useMemo(() => {
    const names = groups.map((g) => g.name);
    for (const c of SUGGESTED_CATEGORIES) if (!names.includes(c)) names.push(c);
    return names;
  }, [groups]);

  const q = filter.q.trim().toLowerCase();
  const filtersActive = filter.status !== "all" || filter.assignee !== "all" || q !== "";
  const matches = useCallback(
    (it) =>
      (filter.status === "all" || (filter.status === "done") === Boolean(it.done)) &&
      (filter.assignee === "all" || it.assignee === filter.assignee) &&
      (!q ||
        it.title.toLowerCase().includes(q) ||
        (it.notes || "").toLowerCase().includes(q) ||
        (it.category || "").toLowerCase().includes(q)),
    [filter.status, filter.assignee, q],
  );
  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({ group: g, visibleItems: g.items.filter(matches) }))
        .filter((g) => g.visibleItems.length > 0),
    [groups, matches],
  );

  const total = items.length;
  const doneCount = items.filter((it) => it.done).length;
  const overdue = items.filter((it) => dueStatus(it, today) === "overdue").length;
  const thisWeek = items.filter((it) => ["today", "soon"].includes(dueStatus(it, today))).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const countdown = daysBetween(today, wedding.dateIso);
  const countdownLabel = countdown > 0 ? `J-${countdown}` : countdown === 0 ? "Jour J" : `J+${-countdown}`;

  /* ------------------------------ actions ------------------------------- */
  const toggle = async (item) => {
    const done = !item.done;
    applyLocal([{ id: item.id, patch: { done } }]);
    try {
      await run(() => updateItem(item.id, { done }), { lock: false });
    } catch {
      /* already reported by run() */
    }
  };

  const saveNew = async (values) => {
    await run(() => addItem({ ...values, done: false, sort_order: nextSortOrder(items, values.category) }));
    setAddOpen(false);
  };

  const quickAdd = async (category, title) => {
    try {
      await run(() => addItem({ title, category, done: false, sort_order: nextSortOrder(items, category) }), {
        lock: false,
      });
    } catch {
      /* reported */
    }
  };

  const saveEdit = async (item, values) => {
    const patch = { ...values };
    if (values.category !== item.category) patch.sort_order = nextSortOrder(items, values.category);
    await run(() => updateItem(item.id, patch));
    setEditingId(null);
  };

  const remove = async (item) => {
    if (!window.confirm(`Supprimer la tâche « ${item.title} » ?`)) return;
    try {
      await run(() => deleteItems([item.id]));
    } catch {
      /* reported */
    }
  };

  const persistOrder = async (nextGroups) => {
    const changes = reorderChanges(nextGroups);
    if (!changes.length) return;
    applyLocal(changes);
    try {
      await run(() => updateMany(changes));
    } catch {
      /* reported */
    }
  };
  const moveOne = (item, dir) => persistOrder(moveItem(groups, item.id, dir));
  const moveCat = (group, dir) => persistOrder(moveCategory(groups, group.name, dir));

  const rename = async (group, name) => {
    try {
      await run(() => updateMany(group.items.map((it) => ({ id: it.id, patch: { category: name } }))));
    } catch {
      /* reported */
    }
  };

  const removeCategory = async (group) => {
    const n = group.items.length;
    if (!window.confirm(`Supprimer la catégorie « ${group.name} » et ses ${n} tâche${n > 1 ? "s" : ""} ?`)) return;
    try {
      await run(() => deleteItems(group.items.map((it) => it.id)));
    } catch {
      /* reported */
    }
  };

  const loadTemplate = async () => {
    const rows = missingTemplateItems(items, wedding.dateIso);
    if (!rows.length) {
      setNotice("Toutes les tâches de la liste type sont déjà présentes.");
      return;
    }
    if (
      items.length &&
      !window.confirm(`Ajouter ${rows.length} tâche${rows.length > 1 ? "s" : ""} de la liste type ? Vos tâches actuelles sont conservées.`)
    ) {
      return;
    }
    try {
      await run(() => addItems(rows));
      setNotice(`${rows.length} tâche${rows.length > 1 ? "s" : ""} ajoutée${rows.length > 1 ? "s" : ""} depuis la liste type. Modifiez, déplacez ou supprimez ce qui ne vous concerne pas.`);
    } catch {
      /* reported */
    }
  };

  /* ------------------------------- render ------------------------------- */
  return (
    <>
      <div className="admin__bar">
        <div className="admin-stats">
          <span className="admin-stat">
            <strong>{doneCount}</strong>/ {total} faites
          </span>
          <span className={"admin-stat" + (overdue ? " is-warning" : "")}>
            <strong>{overdue}</strong> en retard
          </span>
          <span className="admin-stat">
            <strong>{thisWeek}</strong> cette semaine
          </span>
          <span className="admin-stat" title={wedding.dateLong}>
            <strong>{countdownLabel}</strong> {countdown > 0 ? "avant le mariage" : ""}
          </span>
        </div>
        <div className="admin__actions">
          <button className="btn btn--gold" onClick={() => setAddOpen((v) => !v)} disabled={busy}>
            {addOpen ? "Fermer le formulaire" : "+ Ajouter une tâche"}
          </button>
          <button className="btn btn--ghost" onClick={loadTemplate} disabled={busy || status !== "ready"} title="Ajoute les tâches types manquantes, sans toucher aux vôtres">
            Liste type
          </button>
          <button className="btn btn--ghost" onClick={refresh} disabled={busy}>
            Rafraîchir
          </button>
          {!demo && (
            <button className="btn btn--ghost" onClick={onSignOut} disabled={busy}>
              Se déconnecter
            </button>
          )}
        </div>
      </div>

      <div className="cl-progress cl-progress--main" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Avancement global : ${pct} %`}>
        <span style={{ width: `${pct}%` }} />
      </div>

      {demo && (
        <p className="carpool__demo">
          Mode démo (checklist locale à cet appareil) : connectez Supabase pour la partager entre vous, en temps réel.
        </p>
      )}
      {error && <p className="rsvp__error">{error}</p>}
      {notice && <p className="admin__notice">{notice}</p>}

      <datalist id="cl-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {addOpen && (
        <div className="cl-panel">
          <h3 className="cl-panel__title">Nouvelle tâche</h3>
          <ItemForm
            initial={{ category: groups[0]?.name || DEFAULT_CATEGORY }}
            submitLabel="Ajouter la tâche"
            idPrefix="cl-add"
            onSubmit={saveNew}
            onCancel={() => setAddOpen(false)}
            autoFocus
          />
        </div>
      )}

      {status === "loading" && <p className="admin__empty">Chargement…</p>}

      {status === "ready" && total === 0 && (
        <div className="cl-empty">
          <p className="cl-empty__title">Votre checklist est vide.</p>
          <p className="cl-empty__hint">
            Chargez la liste type ({TEMPLATE.length} tâches adaptées à votre mariage, avec des échéances calculées à
            partir du {wedding.dateLong.toLowerCase()}), puis modifiez-la à votre guise. Ou partez d'une page blanche.
          </p>
          <div className="cl-empty__actions">
            <button className="btn btn--gold" onClick={loadTemplate} disabled={busy}>
              Charger la liste type
            </button>
            <button className="btn btn--ghost" onClick={() => setAddOpen(true)} disabled={busy}>
              Ajouter une tâche
            </button>
          </div>
        </div>
      )}

      {total > 0 && (
        <>
          <div className="cl-toolbar">
            <div className="cl-filters" role="group" aria-label="Filtrer par état">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={"cl-filter" + (filter.status === f.value ? " is-active" : "")}
                  aria-pressed={filter.status === f.value}
                  onClick={() => setFilter((x) => ({ ...x, status: f.value }))}
                >
                  {f.label}
                  <span className="cl-filter__n">
                    {f.value === "all" ? total : f.value === "done" ? doneCount : total - doneCount}
                  </span>
                </button>
              ))}
            </div>
            <select
              className="cl-select"
              aria-label="Filtrer par personne"
              value={filter.assignee}
              onChange={(e) => setFilter((x) => ({ ...x, assignee: e.target.value }))}
            >
              <option value="all">Tout le monde</option>
              {ASSIGNEES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <input
              className="cl-search"
              type="search"
              placeholder="Rechercher…"
              aria-label="Rechercher une tâche"
              value={filter.q}
              onChange={(e) => setFilter((x) => ({ ...x, q: e.target.value }))}
            />
            {filtersActive && (
              <button
                type="button"
                className="linklike"
                onClick={() => setFilter({ status: "all", assignee: "all", q: "" })}
              >
                Réinitialiser
              </button>
            )}
          </div>
          {filtersActive && (
            <p className="cl-hint">Le réordonnancement est désactivé tant qu'un filtre est actif.</p>
          )}

          {visibleGroups.length === 0 ? (
            <p className="admin__empty">Aucune tâche ne correspond à ces filtres.</p>
          ) : (
            <div className="cl-board">
              {visibleGroups.map(({ group, visibleItems }, i) => (
                <CategorySection
                  key={group.name}
                  group={group}
                  visibleItems={visibleItems}
                  today={today}
                  canMove={!filtersActive}
                  isFirst={i === 0}
                  isLast={i === visibleGroups.length - 1}
                  busy={busy}
                  editingId={editingId}
                  onToggle={toggle}
                  onStartEdit={(item) => {
                    setAddOpen(false);
                    setEditingId(item.id);
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={saveEdit}
                  onDelete={remove}
                  onMoveItem={moveOne}
                  onQuickAdd={quickAdd}
                  onRename={rename}
                  onDeleteCategory={removeCategory}
                  onMoveCategory={moveCat}
                />
              ))}
            </div>
          )}
        </>
      )}

      {checklistMode === "supabase" && total > 0 && (
        <p className="cl-footnote">Les modifications sont enregistrées automatiquement et visibles par vous deux.</p>
      )}
    </>
  );
}

export default function ChecklistPage() {
  useEffect(() => {
    document.title = `Checklist mariage · ${wedding.couple}`;
  }, []);

  return (
    <AdminGate title="Checklist">
      {({ demo, signOut }) => <ChecklistBoard demo={demo} onSignOut={signOut} />}
    </AdminGate>
  );
}
