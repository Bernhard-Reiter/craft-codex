/**
 * Gemeinsamer Waechter der Live-Sprach-Routen (Lienz-Demo):
 * Zugangscode-Cookie, gleiche Herkunft (Origin), Rate-Limit je IP.
 * Die Middleware deckt /api NICHT ab — darum prueft jede Route selbst.
 */

import { jsonError } from "../../_lib/server-voice";
import {
  ZUGANG_COOKIE,
  cookieAusHeader,
  pruefeZugang,
  zugangErlaubt,
} from "../../../../../lib/demo/zugang";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "local";
}

/** Fixed-Window-Limiter je Name + IP (pro Server-Instanz). */
const buckets = new Map<string, { count: number; reset: number }>();

export function limitErreicht(
  req: Request,
  name: string,
  max: number,
  fensterMs: number,
  now: number = Date.now(),
): boolean {
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  const key = `${name}:${clientIp(req)}`;
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + fensterMs });
    return false;
  }
  if (b.count >= max) return true;
  b.count += 1;
  return false;
}

/** Nur fuer Tests. */
export function resetLimits(): void {
  buckets.clear();
}

/** Browser-Anfragen muessen von derselben Herkunft kommen. */
export function fremdeHerkunft(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false; // gleiche Herkunft bei GET/navigations; fetch setzt Origin bei POST
  try {
    return new URL(origin).host !== new URL(req.url).host;
  } catch {
    return true;
  }
}

/** null = darf weiter; sonst die Fehlerantwort. */
export async function liveWaechter(
  req: Request,
  limit: { name: string; max: number; fensterMs: number },
): Promise<Response | null> {
  if (fremdeHerkunft(req)) return jsonError(403, "forbidden_origin");
  const status = await pruefeZugang(cookieAusHeader(req.headers.get("cookie"), ZUGANG_COOKIE));
  if (status === "unkonfiguriert") return jsonError(503, "zugang_unkonfiguriert");
  if (!zugangErlaubt(status)) return jsonError(401, "zugang_noetig");
  if (limitErreicht(req, limit.name, limit.max, limit.fensterMs)) return jsonError(429, "rate_limited");
  return null;
}
