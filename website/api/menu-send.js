// Mariés only: email the menu request to the given households.
//   POST /api/menu-send { ids: [householdId, …] }  (Authorization: Bearer <session>)
// Households without an email are skipped (their link is copied by hand).
import { adminClient, readJson, requireMaries } from "./_lib/server.js";
import { requestEmail, sendBatch } from "./_lib/mail.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  try {
    if (!(await requireMaries(req))) return res.status(401).json({ error: "unauthorized" });

    const ids = [...new Set(readJson(req).ids || [])].filter((id) => typeof id === "string").slice(0, 100);
    if (!ids.length) return res.status(400).json({ error: "no-ids" });

    const db = adminClient();
    const { data, error } = await db
      .from("menu_households")
      .select("id, token, name, email, lang, confirmed_at")
      .in("id", ids);
    if (error) throw error;

    const targets = (data || []).filter((h) => h.email && !h.confirmed_at);
    if (!targets.length) return res.status(200).json({ sent: 0, skipped: ids.length });

    await sendBatch(targets.map(requestEmail));
    const { error: upErr } = await db
      .from("menu_households")
      .update({ request_sent_at: new Date().toISOString() })
      .in("id", targets.map((h) => h.id));
    if (upErr) console.error("[menu-send] sent but status not saved:", upErr);

    return res.status(200).json({ sent: targets.length, skipped: ids.length - targets.length });
  } catch (err) {
    console.error("[menu-send] error:", err);
    return res.status(500).json({ error: "server", detail: String(err?.message || "") });
  }
}
