/**
 * Google Gemini TTS provider (Phase E option B).
 *
 * Bake-off 2026-06-10 against the demo sentence: quality convinced, latency
 * ~7.5s per answer — too slow for LIVE first-word, perfectly fine for the
 * pre-generated offline cache (which is how the Lienz demo speaks anyway).
 * Big win: runs on the EXISTING Gemini key — no extra vendor account.
 *
 * API: generateContent with responseModalities ["AUDIO"]; returns inline
 * base64 PCM Int16 (sample rate encoded in the mimeType, e.g.
 * "audio/L16;codec=pcm;rate=24000") — same wire format as our cache/player.
 */

import type { ITTSProvider, TTSChunk, TTSOptions } from "@craft-codex/core";

type FetchLike = typeof globalThis.fetch;

export interface GeminiTTSConfig {
  apiKey: string;
  /** Default: gemini-3.1-flash-tts-preview (verified available 2026-06-10). */
  model?: string;
  /** Prebuilt voice name. Default "Kore" (clear female, good German). */
  defaultVoice?: string;
  endpoint?: string;
  fetchImpl?: FetchLike;
}

const DEFAULT_MODEL = "gemini-3.1-flash-tts-preview";
const DEFAULT_VOICE = "Kore";
const DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com";

export class GeminiTTSProvider implements ITTSProvider {
  private apiKey: string;
  private model: string;
  private defaultVoice: string;
  private endpoint: string;
  private fetchImpl: FetchLike;

  constructor(config: GeminiTTSConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.defaultVoice = config.defaultVoice ?? DEFAULT_VOICE;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch;
  }

  async *synthesizeStream(text: string, options?: TTSOptions): AsyncIterable<TTSChunk> {
    if (!this.apiKey) throw new Error("GeminiTTSProvider: apiKey missing");
    const voice = options?.voiceId ?? this.defaultVoice;
    const url = `${this.endpoint}/v1beta/models/${this.model}:generateContent`;

    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": this.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`GeminiTTS HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part?.inlineData) throw new Error("GeminiTTS: no audio in response");

    const sampleRate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] ?? 24000);
    const binary = atob(part.inlineData.data);
    const audio = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) audio[i] = binary.charCodeAt(i);

    yield { audio, sampleRate };
  }
}
