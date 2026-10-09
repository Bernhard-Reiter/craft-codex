/**
 * POST /api/voice/realtime/wissen — Backend des Werkzeugs "suche_wissen"
 * (Lienz-Demo). Der Browser reicht den Function-Call des Sprachmodells
 * hierher weiter; gesucht wird NUR im lokalen, geprueften Korpus.
 *
 * Body: { frage: string (1..300), locale?: "de"|"en" }
 */

import { z } from "zod";
import { jsonError, serverRag } from "../../_lib/server-voice";
import { liveWaechter } from "../_lib/guard";
import { parseVoiceLocale } from "../../../../../lib/voice/voice-locale";
import { MAX_TREFFER, zuWissensAntwort } from "../../../../../lib/voice/wissen-suche";

export const dynamic = "force-dynamic";

const WISSEN_LIMIT = { name: "rt-wissen", max: 60, fensterMs: 60 * 1000 };

const bodySchema = z.object({
  frage: z.string().trim().min(1).max(300),
  locale: z.unknown().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const block = await liveWaechter(req, WISSEN_LIMIT);
  if (block) return block;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "invalid_frage");
  const locale = parseVoiceLocale(parsed.data.locale);
  if (!locale) return jsonError(400, "invalid_locale");

  const { rag } = serverRag(locale);
  const docs = await rag.query(parsed.data.frage, { topK: MAX_TREFFER, minScore: 0.08 });

  return new Response(JSON.stringify(zuWissensAntwort(docs)), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
