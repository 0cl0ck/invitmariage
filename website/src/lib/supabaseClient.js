import { createClient } from "@supabase/supabase-js";

// Configured via website/.env.local (see .env.example):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// When not configured, supabase stays null and the data layer falls back to a
// local (per-device) demo store so the site still runs.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
