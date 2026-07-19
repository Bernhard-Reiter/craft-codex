import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-seitige Supabase-Clients. NUR aus Server-Code importieren
 * (Server-Actions, Server-Components) — nie in Client-Bundles.
 *
 * Beide Factories sind LAZY: kein Top-Level createClient, damit der
 * Prod-Build auch ohne CRAFT_-Env-Variablen gruen bleibt
 * (Memory-Lehre: eager-admin-client-build-footgun).
 */

function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("lib/supabase/server.ts must never run in the browser");
  }
}

/**
 * All server-side Supabase calls get a hard upper bound — a hung request must
 * never block a server action / dynamic render indefinitely (review finding).
 */
const REQUEST_TIMEOUT_MS = 15_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name} (server-side Supabase config)`);
  }
  return value;
}

/**
 * Service-Role-Client — umgeht RLS. Nur fuer das Admin-Review-UI hinter
 * Basic Auth und fuer craft_transition-Aufrufe. NIEMALS fuer den
 * User-Submit-Pfad verwenden (dort ist die RLS-Policy der Waechter).
 */
export function getServiceClient(): SupabaseClient {
  assertServer();
  const url = requireEnv("NEXT_PUBLIC_CRAFT_SUPABASE_URL");
  const key = requireEnv("CRAFT_SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    global: { fetch: fetchWithTimeout },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * User-Scoped-Client: anon key + User-JWT im Authorization-Header.
 * Das ist der ECHTE RLS-Pfad — INSERTs laufen als der eingeloggte User,
 * die INSERT-Policy (author_id = auth.uid(), status='submitted', Lizenz-Gate)
 * wird von Postgres erzwungen, nicht von uns umgangen.
 */
export function getUserScopedClient(accessToken: string): SupabaseClient {
  assertServer();
  const url = requireEnv("NEXT_PUBLIC_CRAFT_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_CRAFT_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
      fetch: fetchWithTimeout,
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
