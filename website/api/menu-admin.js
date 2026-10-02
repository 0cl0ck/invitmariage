// Mariés only: choose (or change) a household's menus on its behalf, for guests
// without email or who can't use their link. No email is sent to the guest.
//   POST /api/menu-admin { id, choices }  (Authorization: Bearer <session>)
import { adminClient, readJson, requireMaries, sanitizeChoices } from "./_lib/server.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  try {
    if (!(await requireMaries(req))) return res.status(401).json({ error: "unauthorized" });

    const body = readJson(req);
    const id = typeof body.id === "string" ? body.id : "";
    const choices = sanitizeChoices(body.choices);
    if (!id || !choices || choices.some((c) => !c.person_name)) {
      return res.status(400).json({ error: "invalid" });
    }

    const db = adminClient();
    const { data: h, error } = await db
      .from("menu_households")
      .select("id, token, confirmed_at, confirmation_sent_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!h) return res.status(404).json({ error: "not-found" });

    // Already confirmed: unlock, then confirm_menu() replaces the choices and
    // locks again in one transaction. The guest's recap email is now outdated.
    if (h.confirmed_at) {
      const { error: unlockErr } = await db
        .from("menu_households")
        .update({ confirmed_at: null, confirmation_sent_at: null })
        .eq("id", h.id);
      if (unlockErr) throw unlockErr;
    }

    const { error: rpcErr } = await db.rpc("confirm_menu", { p_token: h.token, p_choices: choices });
    if (rpcErr) {
      // The transaction rolled back: the old choices are intact, lock them again.
      if (h.confirmed_at) {
        await db
          .from("menu_households")
          .update({ confirmed_at: h.confirmed_at, confirmation_sent_at: h.confirmation_sent_at })
          .eq("id", h.id);
      }
      const msg = rpcErr.message || "";
      if (msg === "already-confirmed") return res.status(409).json({ error: "already-confirmed" });
      if (msg === "bad-count" || rpcErr.code === "23514") return res.status(400).json({ error: "invalid" });
      throw rpcErr;
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[menu-admin] error:", err);
    return res.status(500).json({ error: "server", detail: String(err?.message || "") });
  }
}
