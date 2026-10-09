/**
 * POST /api/zugang — Zugangscode pruefen und Cookie setzen (Lienz-Demo).
 * Body: { pin: string, ziel?: string }  →  { ok: true, ziel } | 401/429
 * Brute-Force-Bremse: 10 Versuche je IP in 10 Minuten.
 */

import { z } from "zod";
import { jsonError } from "../voice/_lib/server-voice";
import { fremdeHerkunft, limitErreicht } from "../voice/realtime/_lib/guard";
import {
  ZUGANG_COOKIE,
  ZUGANG_MAX_AGE_S,
  pinRichtig,
  sicheresZiel,
  zugangsToken,
} from "../../../lib/demo/zugang";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  pin: z.string().min(1).max(64),
  ziel: z.string().max(200).optional(),
});

export async function POST(req: Request): Promise<Response> {
  if (fremdeHerkunft(req)) return jsonError(403, "forbidden_origin");
  if (limitErreicht(req, "zugang", 10, 10 * 60 * 1000)) return jsonError(429, "rate_limited");
  const pin = process.env.DEMO_PIN;
  if (!pin) return jsonError(503, "zugang_unkonfiguriert");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "invalid_body");
  if (!(await pinRichtig(parsed.data.pin))) return jsonError(401, "falscher_code");

  const token = await zugangsToken(pin);
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true, ziel: sicheresZiel(parsed.data.ziel) }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": `${ZUGANG_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ZUGANG_MAX_AGE_S}${secure}`,
    },
  });
}
