/**
 * POST /api/voice/stt?locale=de|en — Whisper transcription, server-side (key never in browser).
 * Body: raw PCM Int16 bytes (the MicRecorder format); locale = language hint
 * 200:  { text: string }
 * 503:  { error: "stt_unavailable" } → client falls back to typed input
 */

import { WhisperSTTProvider } from "../../../../lib/voice/whisper-stt";
import { jsonError, rateLimited } from "../_lib/server-voice";
import { parseVoiceLocale } from "../../../../lib/voice/voice-locale";

export const dynamic = "force-dynamic";

// 16kHz Int16 mono ≈ 32 KB/s → 10 MB ≈ 5 min audio, far above any demo question.
// (content-length kann bei chunked fehlen/falsch sein → drainStream cappt hart.)
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
  const limited = rateLimited(req);
  if (limited) return limited;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError(503, "stt_unavailable");
  if (!req.body) return jsonError(400, "audio_required");

  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_AUDIO_BYTES) return jsonError(413, "audio_too_large");

  const locale = parseVoiceLocale(
    new URL(req.url).searchParams.get("locale") ?? undefined,
  );
  if (locale === null) return jsonError(400, "invalid_locale");

  const stt = new WhisperSTTProvider({ apiKey, language: locale });
  try {
    let text = "";
    for await (const chunk of stt.transcribeStream(req.body as ReadableStream<Uint8Array>)) {
      if (chunk.isFinal) text = chunk.text;
    }
    return Response.json({ text });
  } catch (err) {
    if (err instanceof Error && err.message === "audio_too_large") {
      return jsonError(413, "audio_too_large");
    }
    console.error("[voice/stt] upstream error:", err);
    return jsonError(502, "stt_failed");
  }
}
