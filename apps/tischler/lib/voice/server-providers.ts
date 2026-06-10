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
  answer: "claude" | "template";
}

/** Probe /api/voice/health. Returns null when the server is unreachable (offline/static hosting). */
export async function probeServerVoice(fetchImpl?: FetchLike): Promise<ServerVoiceHealth | null> {
  const f = fetchImpl ?? globalThis.fetch;
  try {
    const res = await f("/api/voice/health", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ServerVoiceHealth;
  } catch {
    return null;
  }
}

/** TTS over /api/voice/tts — yields one PCM chunk (sample rate from header). */
export class ServerTTSProvider implements ITTSProvider {
  constructor(private fetchImpl?: FetchLike) {}

  async *synthesizeStream(text: string, _options?: TTSOptions): AsyncIterable<TTSChunk> {
    const f = this.fetchImpl ?? globalThis.fetch;
    const res = await f("/api/voice/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
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
  constructor(private fetchImpl?: FetchLike) {}

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
    const res = await f("/api/voice/stt", {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: pcm,
    });
    if (!res.ok) {
      throw new Error(res.status === 503 ? "stt_unavailable" : `stt_http_${res.status}`);
    }
    const data = (await res.json()) as { text?: string };
    yield { text: data.text ?? "", isFinal: true };
  }
}

/** Answer over /api/voice/answer (RAG runs server-side; works without any key). */
export function createServerAnswerFn(fetchImpl?: FetchLike): AnswerFn {
  return async (query: string): Promise<string> => {
    const f = fetchImpl ?? globalThis.fetch;
    const res = await f("/api/voice/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: query }),
    });
    if (!res.ok) throw new Error(`answer_http_${res.status}`);
    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  };
}
