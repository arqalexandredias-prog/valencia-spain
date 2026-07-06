import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
).trim();

const hasValidUrl =
  supabaseUrl.length > 0 &&
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes("supabase.co");

const hasValidKey =
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes("COLE_AQUI") &&
  !supabaseAnonKey.includes("SUA_CHAVE") &&
  !supabaseAnonKey.includes("SUA_CHAVE_INTEIRA");

export const isSupabaseConfigured = hasValidUrl && hasValidKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;