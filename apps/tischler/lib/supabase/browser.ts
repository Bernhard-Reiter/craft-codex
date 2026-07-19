"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-Supabase-Client (anon key) fuer Magic-Link-Auth auf /beitragen.
 *
 * Lazy Singleton: wird erst beim ersten Aufruf erzeugt — NIE auf Modul-Ebene
 * (eager-admin-client-build-footgun: Top-Level createClient bricht den Build,
 * wenn die Env-Variablen fehlen). Gibt `null` zurueck, wenn die App ohne
 * Supabase-Konfiguration laeuft — die Seite zeigt dann einen Hinweis statt
 * zu crashen (Offline-Doktrin: die App bricht nie).
 */
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_CRAFT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_CRAFT_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
