/**
 * Phase E client side — thin providers that talk to our OWN /api/voice/*
 * routes. No API key ever reaches the browser; a 503 from a route signals
 * "not configured", and the caller falls back along the offline chain
 * (cached PCM → template answer → mock).
 */

import type {
  ISTTProvider,
  ITTSProvider,
  STTChunk,
  TTSChunk,
  TTSOptions,
} from "@craft-codex/core";
import type { AnswerFn } from "./pipeline";

type FetchLike = typeof globalThis.fetch;

export interface ServerVoiceHealth {
  ok: boolean;
  stt: boolean;
  tts: boolean;
  answer: "gemini" | "claude" | "template";
}

// Timeouts: ein HÄNGENDER Server (TCP offen, Antwort verzögert) darf die
// Pipeline nicht unbegrenzt blockieren — bei Timeout greift der Offline-/
// Fallback-Pfad. Probe kurz (Bundle soll schnell auflösen), die echten
// Provider großzügig (Gemini-TTS dauert real ~13s).
const PROBE_TIMEOUT_MS = 4000;
const PROVIDER_TIMEOUT_MS = 30000;

/** Probe /api/voice/health. Returns null when the server is unreachable (offline/static hosting). */
export async function probeServerVoice(fetchImpl?: FetchLike): Promise<ServerVoiceHealth | null> {
  const f = fetchImpl ?? globalThis.fetch;
  try {
    const res = await f("/api/voice/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerVoiceHealth;
  } catch {
    return null;
  }
}

/** TTS over /api/voice/tts — yields one PCM chunk (sample rate from header). */
export class ServerTTSProvider implements ITTSProvider {
  constructor(
    private fetchImpl?: FetchLike,
    private locale: "de" | "en" = "de",
  ) {}

  async *synthesizeStream(text: string, _options?: TTSOptions): AsyncIterable<TTSChunk> {
    const f = this.fetchImpl ?? globalThis.fetch;
    const res = await f("/api/voice/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, locale: this.locale }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(res.status === 503 ? "tts_unavailable" : `tts_http_${res.status}`);
    }
    const sampleRate = Number(res.headers.get("x-sample-rate") || 24000);
    const audio = new Uint8Array(await res.arrayBuffer());
    yield { audio, sampleRate };
  }
}

/** STT over /api/voice/stt — collects the mic PCM stream, posts it, yields the final transcript. */
export class ServerSTTProvider implements ISTTProvider {
  constructor(
    private fetchImpl?: FetchLike,
    private locale: "de" | "en" = "de",
  ) {}

  async *transcribeStream(audioStream: ReadableStream<Uint8Array>): AsyncIterable<STTChunk> {
    const reader = audioStream.getReader();
    const parts: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) parts.push(value);
    }
    const total = parts.reduce((n, p) => n + p.length, 0);
    const pcm = new Uint8Array(total);
    let off = 0;
    for (const p of parts) {
      pcm.set(p, off);
      off += p.length;
    }

    const f = this.fetchImpl ?? globalThis.fetch;
    const res = await f(`/api/voice/stt?locale=${this.locale}`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: pcm,
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(res.status === 503 ? "stt_unavailable" : `stt_http_${res.status}`);
    }
    const data = (await res.json()) as { text?: string };
    yield { text: data.text ?? "", isFinal: true };
  }
}

/**
 * Answer over /api/voice/answer (RAG runs server-side; works without any key).
 * Pass the recent dialog turns so follow-up questions keep their context —
 * the route forwards them to the Gemini dialog brain. `locale` steuert
 * Meister-Sprache + Korpus (Default "de").
 */
export function createServerAnswerFn(
  fetchImpl?: FetchLike,
  history?: ReadonlyArray<{ question: string; answer: string }>,
  locale: "de" | "en" = "de",
): AnswerFn {
  return async (query: string): Promise<string> => {
    const f = fetchImpl ?? globalThis.fetch;
    const res = await f("/api/voice/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: query, history: history ?? [], locale }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`answer_http_${res.status}`);
    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  };
}
