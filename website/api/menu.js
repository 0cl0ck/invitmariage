// Guest menu endpoint (/menu/<token> page).
//   GET  /api/menu?token=…            → household, confirmed choices
//   POST /api/menu { token, choices } → confirm (final) + confirmation email
import { adminClient, readJson, sanitizeChoices } from "./_lib/server.js";
import { confirmationEmail, sendEmail } from "./_lib/mail.js";

const TOKEN_RE = /^[0-9a-f]{32}$/;

async function loadHousehold(db, token) {
  const { data, error } = await db
    .from("menu_households")
    .select("id, name, email, lang, adults, children, confirmed_at, confirmation_sent_at")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadChoices(db, householdId) {
  const { data, error } = await db
    .from("menu_choices")
    .select("person_name, kind, starter, main, cheese")
    .eq("household_id", householdId)
    .order("position");
  if (error) throw error;
  return data || [];
}

// The link may be forwarded (WhatsApp…): never return the full address.
function maskEmail(email) {
  if (!email) return null;
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}…@${domain}`;
}

function publicHousehold(h) {
  return {
    name: h.name,
    email: maskEmail(h.email),
    lang: h.lang,
    adults: h.adults,
    children: h.children,
    confirmedAt: h.confirmed_at,
    confirmationSent: Boolean(h.confirmation_sent_at),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const db = adminClient();

    if (req.method === "GET") {
      const token = String(req.query.token || "");
      if (!TOKEN_RE.test(token)) return res.status(404).json({ error: "not-found" });
      const h = await loadHousehold(db, token);
      if (!h) return res.status(404).json({ error: "not-found" });
      const choices = h.confirmed_at ? await loadChoices(db, h.id) : [];
      return res.status(200).json({ household: publicHousehold(h), choices });
    }

    if (req.method === "POST") {
      const body = readJson(req);
      const token = String(body.token || "");
      if (!TOKEN_RE.test(token)) return res.status(404).json({ error: "not-found" });
      const choices = sanitizeChoices(body.choices);
      if (!choices || choices.some((c) => !c.person_name)) {
        return res.status(400).json({ error: "invalid" });
      }

      const { error } = await db.rpc("confirm_menu", { p_token: token, p_choices: choices });
      if (error) {
        const msg = error.message || "";
        if (msg === "not-found") return res.status(404).json({ error: "not-found" });
        if (msg === "already-confirmed") return res.status(409).json({ error: "already-confirmed" });
        if (msg === "bad-count" || error.code === "23514") return res.status(400).json({ error: "invalid" });
        throw error;
      }

      // Choices are saved: a failed email must not look like a failed answer.
      const h = await loadHousehold(db, token);
      const saved = await loadChoices(db, h.id);
      let emailSent = false;
      if (h.email) {
        try {
          await sendEmail(confirmationEmail(h, saved));
          await db.from("menu_households").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", h.id);
          emailSent = true;
        } catch (err) {
          console.error("[menu] confirmation email failed:", err);
        }
      }
      return res.status(200).json({ household: { ...publicHousehold(h), confirmationSent: emailSent }, choices: saved });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (err) {
    console.error("[menu] error:", err);
    return res.status(500).json({ error: "server" });
  }
}
