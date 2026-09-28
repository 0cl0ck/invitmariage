// Shared helpers for the /api functions (files under api/_lib are not routes).
// The service_role client bypasses RLS: never expose it or its results raw.
import { createClient } from "@supabase/supabase-js";

let admin = null;

export function adminClient() {
  if (!admin) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("supabase-not-configured");
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

export function siteUrl() {
  return (process.env.SITE_URL || "https://www.hugolaura.fr").replace(/\/+$/, "");
}

export function menuLink(household) {
  const lang = household.lang === "es" ? "?lang=es" : "";
  return `${siteUrl()}/menu/${household.token}${lang}`;
}

// Accounts allowed to send emails (comma-separated), besides being signed in.
const MARIES = (process.env.MARIES_EMAILS || "hugodewas@gmail.com,laura.arenas.n@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** Resolves the mariés' session from the Authorization header, else null. */
export async function requireMaries(req) {
  const header = req.headers.authorization || "";
  const jwt = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!jwt) return null;
  const { data, error } = await adminClient().auth.getUser(jwt);
  if (error || !data?.user) return null;
  if (!MARIES.includes((data.user.email || "").toLowerCase())) return null;
  return data.user;
}

export function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}
