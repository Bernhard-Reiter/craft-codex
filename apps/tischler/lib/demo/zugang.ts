/**
 * Demo-Zugang (Lienz): einfacher Zugangscode vor der ganzen App, damit fremde
 * Besucher keine bezahlten Sprach-Sitzungen ausloesen.
 *
 * - DEMO_PIN (Server-Env) gesetzt → Zugang nur mit Cookie, dessen Wert der
 *   SHA-256 von "craft-demo-zugang:v1:" + DEMO_PIN ist (HttpOnly, Secure).
 * - DEMO_PIN fehlt → in Produktion GESCHLOSSEN (fail-closed), nur im lokalen
 *   Dev-Server (NODE_ENV=development) offen.
 *
 * Edge-tauglich (Web Crypto), laeuft in Middleware UND Node-Routen.
 */

import { sha256, timingSafeEqualStrings } from "../security/timing-safe";

export const ZUGANG_COOKIE = "cc_demo_zugang";
export const ZUGANG_MAX_AGE_S = 12 * 60 * 60;

export type ZugangsStatus = "offen" | "ok" | "gesperrt" | "unkonfiguriert";

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

export async function zugangsToken(pin: string): Promise<string> {
  return toHex(await sha256(`craft-demo-zugang:v1:${pin}`));
}

interface ZugangsEnv {
  DEMO_PIN?: string;
  NODE_ENV?: string;
}

/** Prueft das Cookie gegen DEMO_PIN. */
export async function pruefeZugang(
  cookieWert: string | undefined,
  env: ZugangsEnv = process.env as ZugangsEnv,
): Promise<ZugangsStatus> {
  const pin = env.DEMO_PIN;
  if (!pin) return env.NODE_ENV === "development" ? "offen" : "unkonfiguriert";
  if (!cookieWert) return "gesperrt";
  const soll = await zugangsToken(pin);
  return (await timingSafeEqualStrings(cookieWert, soll)) ? "ok" : "gesperrt";
}

export function zugangErlaubt(status: ZugangsStatus): boolean {
  return status === "ok" || status === "offen";
}

/** Prueft einen eingegebenen Code gegen DEMO_PIN (timing-safe). */
export async function pinRichtig(
  eingabe: string,
  env: ZugangsEnv = process.env as ZugangsEnv,
): Promise<boolean> {
  const pin = env.DEMO_PIN;
  if (!pin) return false;
  return timingSafeEqualStrings(eingabe, pin);
}

/** Liest einen Cookie-Wert aus dem Cookie-Header (Route-Handler ohne next/headers). */
export function cookieAusHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const teil of header.split(";")) {
    const i = teil.indexOf("=");
    if (i < 0) continue;
    if (teil.slice(0, i).trim() === name) return decodeURIComponent(teil.slice(i + 1).trim());
  }
  return undefined;
}

/** Nur relative Ziele innerhalb der App (kein Open Redirect). */
export function sicheresZiel(raw: string | null | undefined): string {
  const fallback = "/de/voice";
  // Steuerzeichen + Backslash weg: Browser streichen TAB/LF/CR beim Parsen ("/\t/x" → "//x").
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\u0000-\u001f\u007f\\]/.test(raw)) {
    return fallback;
  }
  try {
    const basis = "https://x.invalid";
    const u = new URL(raw, basis);
    if (u.origin !== basis) return fallback;
    return u.pathname + u.search;
  } catch {
    return fallback;
  }
}
