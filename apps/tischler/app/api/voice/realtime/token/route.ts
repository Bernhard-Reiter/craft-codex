/**
 * POST /api/voice/realtime/token — stellt einen Kurzzeit-Schluessel fuer eine
 * OpenAI-Realtime-Sitzung aus (Lienz-Demo). OPENAI_API_KEY bleibt auf dem
 * Server; Persona, Werkzeug und Stimme legt der Server fest.
 *
 * Body: { locale?: "de"|"en", thema?: "allgemein"|"zinken" }
 * Antwort: { token, expiresAt, model, maxSessionMs }  (Cache-Control: no-store)
 */

import { jsonError } from "../../_lib/server-voice";
import { liveWaechter } from "../_lib/guard";
import { parseVoiceLocale } from "../../../../../lib/voice/voice-locale";
import {
  REALTIME_DEFAULT_MODEL,
  REALTIME_MAX_SESSION_MS,
  buildClientSecretRequest,
  parseThema,
  transcribeModelAusEnv,
} from "../../../../../lib/voice/realtime-config";

export const dynamic = "force-dynamic";

/** Kosten-Bremse: max. 6 Sitzungen je IP in 10 Minuten. */
const TOKEN_LIMIT = { name: "rt-token", max: 6, fensterMs: 10 * 60 * 1000 };

export async function POST(req: Request): Promise<Response> {
  const block = await liveWaechter(req, TOKEN_LIMIT);
  if (block) return block;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError(503, "realtime_unavailable");

  let body: { locale?: unknown; thema?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }
  const locale = parseVoiceLocale(body.locale);
  if (!locale) return jsonError(400, "invalid_locale");

  const model = process.env.OPENAI_REALTIME_MODEL || REALTIME_DEFAULT_MODEL;
  const payload = buildClientSecretRequest({
    locale,
    thema: parseThema(body.thema),
    model,
    voice: process.env.OPENAI_REALTIME_VOICE,
    transcribeModel: transcribeModelAusEnv(process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL),
  });

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return jsonError(502, "realtime_upstream_unreachable");
  }
  if (!res.ok) {
    // Fehlertext von OpenAI nur gekuerzt durchreichen (enthaelt keinen Schluessel).
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[realtime-token] upstream ${res.status}: ${detail}`);
    return jsonError(502, `realtime_upstream_${res.status}`);
  }
  const data = (await res.json()) as { value?: string; expires_at?: number };
  if (!data.value) return jsonError(502, "realtime_no_token");

  return new Response(
    JSON.stringify({
      token: data.value,
      expiresAt: data.expires_at ?? null,
      model,
      maxSessionMs: REALTIME_MAX_SESSION_MS,
    }),
    { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } },
  );
}
