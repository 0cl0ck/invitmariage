// Menu emails (request + confirmation), sent through Resend's HTTP API.
import { menuDict } from "../../src/content/menu.js";
import { menuLink } from "./server.js";

const RESEND_URL = "https://api.resend.com";
const FROM = process.env.MAIL_FROM || "Hugo & Laura <mariage@hugolaura.fr>";
const REPLY_TO = (process.env.MAIL_REPLY_TO || "hugodewas@gmail.com,laura.arenas.n@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const copy = {
  fr: {
    requestSubject: "Votre menu pour notre mariage (10 octobre)",
    hello: (name) => `Bonjour ${name},`,
    requestBody: [
      "Nous avons hâte de vous retrouver le samedi 10 octobre !",
      "Pour le repas, le restaurant nous demande le choix de chacun : entrée, plat, fromage et parfum de gâteau. Cela prend deux minutes.",
    ],
    button: "Choisir notre menu",
    deadline: (d) => `Merci de répondre avant le ${d}. Une fois votre choix confirmé, vous recevrez un récapitulatif par email.`,
    linkFallback: "Si le bouton ne fonctionne pas, copiez ce lien :",
    confirmSubject: "Votre menu est confirmé · Hugo & Laura",
    confirmBody: "Merci ! Voici le récapitulatif de votre menu pour le samedi 10 octobre :",
    confirmFooter: "Un changement indispensable ? Répondez simplement à cet email.",
    signature: "Hugo & Laura",
  },
  es: {
    requestSubject: "Su menú para nuestra boda (10 de octubre)",
    hello: (name) => `Hola ${name}:`,
    requestBody: [
      "¡Tenemos muchas ganas de verlos el sábado 10 de octubre!",
      "Para la comida, el restaurante nos pide la elección de cada uno: entrada, plato fuerte, quesos y sabor de torta. Toma dos minutos.",
    ],
    button: "Elegir nuestro menú",
    deadline: (d) => `Por favor respondan antes del ${d}. Una vez confirmada su elección, recibirán un resumen por correo.`,
    linkFallback: "Si el botón no funciona, copien este enlace:",
    confirmSubject: "Su menú está confirmado · Hugo & Laura",
    confirmBody: "¡Gracias! Este es el resumen de su menú para el sábado 10 de octubre:",
    confirmFooter: "¿Un cambio indispensable? Simplemente respondan a este correo.",
    signature: "Hugo & Laura",
  },
};

function layout(inner) {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f4ece0;font-family:Georgia,serif;color:#2a1f17">
<div style="max-width:520px;margin:0 auto;background:#fffaf2;border:1px solid #e3d3b8;padding:32px 28px;line-height:1.6;font-size:16px">
<p style="text-align:center;color:#a8451f;letter-spacing:.2em;font-size:13px;margin:0 0 24px">H ✦ L</p>
${inner}
</div></body></html>`;
}

/** Plain-text lines describing each person's choices. */
export function recapLines(choices, lang) {
  const { dishes, ui } = menuDict[lang] || menuDict.fr;
  return choices.map((c) => {
    const parts =
      c.kind === "adult"
        ? [dishes[c.starter]?.name, dishes[c.main]?.name, ui.cheeseLine(c.cheese), ui.cakeLine(dishes[c.cake]?.name)]
        : [dishes[c.main]?.name, ui.cakeLine(dishes[c.cake]?.name)];
    return { who: c.person_name, parts };
  });
}

export function requestEmail(household) {
  const lang = household.lang === "es" ? "es" : "fr";
  const t = copy[lang];
  const link = menuLink(household);
  const deadline = menuDict[lang].deadline;
  const html = layout(`
<p>${esc(t.hello(household.name))}</p>
${t.requestBody.map((p) => `<p>${esc(p)}</p>`).join("\n")}
<p style="text-align:center;margin:28px 0">
  <a href="${esc(link)}" style="display:inline-block;background:#a8451f;color:#fffaf2;text-decoration:none;padding:14px 28px;border-radius:4px;font-family:Arial,sans-serif;font-size:16px">${esc(t.button)}</a>
</p>
<p>${esc(t.deadline(deadline))}</p>
<p style="font-size:13px;color:#6b5a48">${esc(t.linkFallback)}<br><a href="${esc(link)}" style="color:#a8451f;word-break:break-all">${esc(link)}</a></p>
<p>${esc(t.signature)}</p>`);
  const text = [t.hello(household.name), "", ...t.requestBody, "", `${t.button} : ${link}`, "", t.deadline(deadline), "", t.signature].join("\n");
  return { from: FROM, to: [household.email], reply_to: REPLY_TO, subject: t.requestSubject, html, text };
}

export function confirmationEmail(household, choices) {
  const lang = household.lang === "es" ? "es" : "fr";
  const t = copy[lang];
  const lines = recapLines(choices, lang);
  const html = layout(`
<p>${esc(t.hello(household.name))}</p>
<p>${esc(t.confirmBody)}</p>
${lines
  .map(
    (l) => `<div style="border-left:3px solid #c9a24b;padding:4px 0 4px 14px;margin:16px 0">
  <strong>${esc(l.who)}</strong><br>${l.parts.map(esc).join("<br>")}
</div>`,
  )
  .join("\n")}
<p>${esc(t.confirmFooter)}</p>
<p>${esc(t.signature)}</p>`);
  const text = [
    t.hello(household.name),
    "",
    t.confirmBody,
    "",
    ...lines.map((l) => `${l.who}${lang === "fr" ? " :" : ":"} ${l.parts.join(" · ")}`),
    "",
    t.confirmFooter,
    "",
    t.signature,
  ].join("\n");
  return { from: FROM, to: [household.email], reply_to: REPLY_TO, subject: t.confirmSubject, html, text };
}

async function resend(path, payload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("resend-not-configured");
  const res = await fetch(`${RESEND_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`resend-${res.status}: ${body?.message || "unknown"}`);
  return body;
}

export const sendEmail = (email) => resend("/emails", email);
/** Up to 100 emails in one call (Resend batch endpoint). */
export const sendBatch = (emails) => resend("/emails/batch", emails);
