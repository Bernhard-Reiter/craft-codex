import { sha256, timingSafeEqualStrings } from "../../security/timing-safe";

/**
 * Werkbank S2b: das Probelauf-Tor ohne DB (Zeichnung b v9, Missbrauchsschutz).
 * Reine Funktionen ohne Next-Kontext, nur Web Crypto (crypto.subtle). Sie laufen in der
 * Edge-Middleware und in der Tor-Route. Kein Log: hier gibt es weder console noch logger.
 *
 * - Konfiguration fail-closed: ZINKEN_MEISTER_CODE genau 32 Hex, ZINKEN_MEISTER_SALZ genau
 *   64 Hex, keine Debug-Env (DEBUG, NODE_DEBUG, ANTHROPIC_LOG). Sonst null = Tor zu.
 * - Code: Leerzeichen raus, Groß/Klein egal. Vergleich zeitkonstant über die sha256-Digests
 *   (lib/security/timing-safe), ein Code anderer Länge ist einfach falsch.
 * - Cookie-Wert sid.ablauf.signatur mit signatur = HMAC-SHA-256(SALZ,
 *   "tor|" + sid + "|" + ablauf + "|" + sha256(Code)). Ablauf = Serverzeit + 12 h.
 *   Geprüft wird mit crypto.subtle.verify, nie mit ===. Weil der Code-Hash in der Signatur
 *   steckt, macht ein Code-Wechsel alle ausgegebenen Cookies ungültig.
 */

export const TOR_COOKIE = "__Host-zinken-tor";
export const TOR_DAUER_S = 12 * 60 * 60;

export interface TorKonfig {
  readonly code: string;
  readonly salz: string;
}

export type TorEnv = Readonly<Record<string, string | undefined>>;

const CODE_FORM = /^[0-9a-f]{32}$/i;
const SALZ_FORM = /^[0-9a-f]{64}$/i;
const COOKIE_FORM = /^([0-9a-f]{32})\.([0-9]{1,15})\.([0-9a-f]{64})$/;
const DEBUG_ENV = ["DEBUG", "NODE_DEBUG", "ANTHROPIC_LOG"] as const;

/** Liest CODE und SALZ. null heißt: Tor zu (fehlt, falsches Format oder Debug-Env gesetzt). */
export function torKonfig(env: TorEnv): TorKonfig | null {
  if (DEBUG_ENV.some((name) => env[name] !== undefined)) return null;
  const code = env.ZINKEN_MEISTER_CODE ?? "";
  const salz = env.ZINKEN_MEISTER_SALZ ?? "";
  if (!CODE_FORM.test(code)) return null;
  if (!SALZ_FORM.test(salz)) return null;
  return { code: code.toLowerCase(), salz: salz.toLowerCase() };
}

/** Leerzeichen raus, Groß/Klein egal. */
export function normalisiereCode(roh: string): string {
  return roh.replace(/\s+/g, "").toLowerCase();
}

/** Zeitkonstant über die sha256-Digests: gleiche Länge immer, keine Ausnahme bei anderer Länge. */
export function codeStimmt(eingabe: string, konfig: TorKonfig): Promise<boolean> {
  return timingSafeEqualStrings(normalisiereCode(eingabe), konfig.code);
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesAusHex(text: string) {
  const bytes = new Uint8Array(text.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(text.slice(2 * i, 2 * i + 2), 16);
  return bytes;
}

function schluessel(konfig: TorKonfig, nutzung: "sign" | "verify") {
  return crypto.subtle.importKey("raw", bytesAusHex(konfig.salz), { name: "HMAC", hash: "SHA-256" }, false, [
    nutzung,
  ]);
}

async function nachricht(konfig: TorKonfig, sid: string, ablauf: string) {
  return new TextEncoder().encode(`tor|${sid}|${ablauf}|${hex(await sha256(konfig.code))}`);
}

/** Neuer Cookie-Wert sid.ablauf.signatur, Ablauf = jetzt + 12 h (Sekunden). */
export async function erzeugeCookieWert(konfig: TorKonfig, jetztMs: number): Promise<string> {
  const sid = hex(crypto.getRandomValues(new Uint8Array(16)));
  const ablauf = String(Math.floor(jetztMs / 1000) + TOR_DAUER_S);
  const signatur = await crypto.subtle.sign("HMAC", await schluessel(konfig, "sign"), await nachricht(konfig, sid, ablauf));
  return `${sid}.${ablauf}.${hex(new Uint8Array(signatur))}`;
}

/** true nur bei richtiger Form, nicht abgelaufen und gültiger Signatur (crypto.subtle.verify). */
export async function pruefeCookie(
  wert: string | undefined,
  konfig: TorKonfig | null,
  jetztMs: number,
): Promise<boolean> {
  if (!konfig || !wert) return false;
  const teile = COOKIE_FORM.exec(wert);
  if (!teile) return false;
  const [, sid, ablauf, signatur] = teile;
  if (sid === undefined || ablauf === undefined || signatur === undefined) return false;
  if (Number(ablauf) * 1000 <= jetztMs) return false;
  return crypto.subtle.verify("HMAC", await schluessel(konfig, "verify"), bytesAusHex(signatur), await nachricht(konfig, sid, ablauf));
}

/** Set-Cookie für das Tor: __Host-, httpOnly, Secure, Path=/, SameSite=Strict, Max-Age 12 h. */
export function torSetCookie(wert: string): string {
  return `${TOR_COOKIE}=${wert}; Path=/; Max-Age=${TOR_DAUER_S}; HttpOnly; Secure; SameSite=Strict`;
}
