import { constantTimeEqual, sha256 } from "../security/timing-safe";

/**
 * HTTP Basic Auth fuer /admin/* — pure Funktion, ohne Next-Kontext,
 * damit sie in der Edge-Middleware laeuft UND als Unit testbar ist.
 *
 * Fail-closed: fehlen CRAFT_ADMIN_USER oder CRAFT_ADMIN_PASS, ist die
 * Antwort IMMER "nicht autorisiert" — nie ein offenes Admin-UI.
 *
 * Timing-safe via lib/security/timing-safe: SHA-256-Digests (fixe Laenge)
 * mit konstantzeitigem XOR-Vergleich — kein Early-Exit auf Zeichenebene.
 * Web Crypto (crypto.subtle) ist in Edge-Runtime und Node >= 20 vorhanden.
 */

/**
 * Prueft einen `Authorization: Basic …`-Header gegen die erwarteten
 * Credentials. `expectedUser`/`expectedPass` kommen aus
 * CRAFT_ADMIN_USER/CRAFT_ADMIN_PASS.
 */
export async function checkBasicAuth(
  authorizationHeader: string | null | undefined,
  expectedUser: string | undefined,
  expectedPass: string | undefined,
): Promise<boolean> {
  // Fail-closed: ohne konfigurierte Credentials niemals durchlassen.
  if (!expectedUser || !expectedPass) return false;
  if (!authorizationHeader || !authorizationHeader.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(authorizationHeader.slice("Basic ".length).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  const [userHash, expectedUserHash, passHash, expectedPassHash] = await Promise.all([
    sha256(user),
    sha256(expectedUser),
    sha256(pass),
    sha256(expectedPass),
  ]);
  // Beide Vergleiche IMMER ausfuehren (kein &&-Short-Circuit auf Ergebnisebene noetig,
  // aber wir berechnen beide Digest-Paare unabhaengig — kein User-Enumeration-Timing).
  const userOk = constantTimeEqual(userHash, expectedUserHash);
  const passOk = constantTimeEqual(passHash, expectedPassHash);
  return userOk && passOk;
}

/** 401-Header fuer den Browser-Login-Prompt. */
export const WWW_AUTHENTICATE_HEADER = 'Basic realm="Craft Codex Admin", charset="UTF-8"';
