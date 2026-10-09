/**
 * POST /api/voice/realtime/wikipedia — Backend des Werkzeugs "wikipedia_suche"
 * (Lienz-Demo). Fester Host de.wikipedia.org, 2 Abrufe, je 5 s Timeout.
 * Zugang wie alle Live-Routen (Zugangscode-Cookie, Origin, Bremse).
 *
 * Body: { frage: string (1..200) }
 */

import { z } from "zod";
import { jsonError } from "../../_lib/server-voice";
import { liveWaechter } from "../_lib/guard";
import { sucheWikipedia } from "../../../../../lib/voice/wikipedia-suche";

export const dynamic = "force-dynamic";

const WIKI_LIMIT = { name: "rt-wikipedia", max: 30, fensterMs: 60 * 1000 };

const bodySchema = z.object({
  frage: z.string().trim().min(1).max(200),
  locale: z.unknown().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const block = await liveWaechter(req, WIKI_LIMIT);
  if (block) return block;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "invalid_frage");

  try {
    const antwort = await sucheWikipedia(parsed.data.frage);
    return new Response(JSON.stringify(antwort), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch {
    return jsonError(502, "wikipedia_nicht_erreichbar");
  }
}
