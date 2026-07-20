import { timingSafeEqualStrings } from "./timing-safe";

/**
 * Bearer-Token-Auth fuer die Service-API (/api/v1/*) — pure Funktion,
 * als Unit testbar, gleiche Timing-Safe-Basis wie die Admin-Basic-Auth.
 *
 * Drei Ausgaenge, damit die Route fail-closed differenzieren kann:
 *   "unconfigured" — Server hat KEIN Token konfiguriert → 503 (nie offen!)
 *   "unauthorized" — Header fehlt/falsch → 401
 *   "ok"           — Token stimmt (timing-safe verglichen)
 */
export type BearerAuthResult = "ok" | "unauthorized" | "unconfigured";

export async function checkBearerAuth(
  authorizationHeader: string | null | undefined,
  expectedToken: string | undefined,
): Promise<BearerAuthResult> {
  // Fail-closed: ohne konfiguriertes Token niemals durchlassen.
  if (!expectedToken) return "unconfigured";
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return "unauthorized";
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) return "unauthorized";
  return (await timingSafeEqualStrings(token, expectedToken)) ? "ok" : "unauthorized";
}
