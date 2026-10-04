// Mariés only: email the menu request to the given households.
//   POST /api/menu-send { ids: [householdId, …] }  (Authorization: Bearer <session>)
// Households without an email are skipped (their link is copied by hand).
// Late invites (ask_rsvp) get the invitation email: presence + diet + menu.
//   POST /api/menu-send { ids, preview: true } → the same emails, sent only to the
//        signed-in marié (subject "[Aperçu] …"); nothing is marked as sent.
import { adminClient, readJson, requireMaries } from "./_lib/server.js";
import { inviteEmail, requestEmail, sendBatch } from "./_lib/mail.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  try {
    const user = await requireMaries(req);
    if (!user) return res.status(401).json({ error: "unauthorized" });

    const body = readJson(req);
    const preview = body.preview === true;
    const ids = [...new Set(body.ids || [])].filter((id) => typeof id === "string").slice(0, preview ? 5 : 100);
    if (!ids.length) return res.status(400).json({ error: "no-ids" });

    const db = adminClient();
    const { data, error } = await db
      .from("menu_households")
      .select("*") // see loadHousehold in menu.js: works before the ask_rsvp migration
      .in("id", ids);
    if (error) throw error;

    const emailFor = (h) => (h.ask_rsvp ? inviteEmail(h) : requestEmail(h));

    if (preview) {
      const shown = (data || []).filter((h) => !h.confirmed_at);
      if (!shown.length) return res.status(200).json({ sent: 0, skipped: ids.length });
      await sendBatch(
        shown.map((h) => {
          const mail = emailFor(h);
          return { ...mail, to: [user.email], subject: `[Aperçu] ${mail.subject}` };
        }),
      );
      return res.status(200).json({ sent: shown.length, skipped: ids.length - shown.length, to: user.email });
    }

    const targets = (data || []).filter((h) => h.email && !h.confirmed_at);
    if (!targets.length) return res.status(200).json({ sent: 0, skipped: ids.length });

    await sendBatch(targets.map(emailFor));
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
