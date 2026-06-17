/**
 * POST /api/voice/tts — ElevenLabs synthesis, server-side (key never in browser).
 * Body: { text: string }
 * 200:  raw PCM Int16 bytes, header X-Sample-Rate (matches the cache player)
 * 503:  { error: "tts_unavailable" } → client falls back to cached PCM / mock
 */

import type { ITTSProvider } from "@craft-codex/core";
import { ElevenLabsTTSProvider } from "../../../../lib/voice/elevenlabs-tts";
import { GeminiTTSProvider } from "../../../../lib/voice/gemini-tts";
import { jsonError, rateLimited, ttsProvider } from "../_lib/server-voice";

export const dynamic = "force-dynamic";

const MAX_TEXT_CHARS = 800;

function buildProvider(): ITTSProvider | null {
  switch (ttsProvider()) {
    case "gemini":
      return new GeminiTTSProvider({
        apiKey: process.env.GEMINI_API_KEY ?? "",
        ...(process.env.GEMINI_TTS_VOICE ? { defaultVoice: process.env.GEMINI_TTS_VOICE } : {}),
        ...(process.env.GEMINI_TTS_MODEL ? { model: process.env.GEMINI_TTS_MODEL } : {}),
      });
    case "elevenlabs":
      return new ElevenLabsTTSProvider({
        apiKey: process.env.ELEVENLABS_API_KEY ?? "",
        ...(process.env.ELEVENLABS_VOICE_ID
          ? { defaultVoiceId: process.env.ELEVENLABS_VOICE_ID }
          : {}),
      });
    default:
      return null;
  }
}

export async function POST(req: Request): Promise<Response> {
  const limited = rateLimited(req);
  if (limited) return limited;

  const tts = buildProvider();
  if (!tts) return jsonError(503, "tts_unavailable");

  let body: { text?: unknown };
  try {
    body = (await req.json()) as { text?: unknown };
  } catch {
    return jsonError(400, "invalid_json");
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError(400, "text_required");
  if (text.length > MAX_TEXT_CHARS) return jsonError(400, "text_too_long");

  try {
    const chunks: Uint8Array[] = [];
    let sampleRate = 24000;
    for await (const chunk of tts.synthesizeStream(text)) {
      chunks.push(chunk.audio);
      sampleRate = chunk.sampleRate;
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const pcm = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      pcm.set(c, off);
      off += c.length;
    }
    return new Response(pcm, {
      status: 200,
      headers: {
        "content-type": "application/octet-stream",
        "x-sample-rate": String(sampleRate),
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[voice/tts] upstream error:", err);
    return jsonError(502, "tts_failed");
  }
}
