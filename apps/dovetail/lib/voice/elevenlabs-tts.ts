import type { ITTSProvider, TTSChunk, TTSOptions } from "@craft-codex/core";

/**
 * ElevenLabs Streaming TTS Provider (Phase D real).
 *
 * Tauschbar gegen MockTTSProvider (Phase C). Liefert PCM 24kHz Chunks.
 *
 * **Dormant ohne API-Key:** Constructor wirft nicht — erst synthesizeStream
 * wirft mit klarem Hinweis. Standard-Voice DE wird als Default genutzt;
 * Caller kann ueber TTSOptions.voiceId ueberschreiben.
 */
export interface ElevenLabsConfig {
  apiKey: string;
  /** Default voice. Caller kann pro Request via TTSOptions.voiceId override. */
  defaultVoiceId?: string;
  /** Default: "eleven_flash_v2_5" — schnellster Modell, ~0.05$/1k chars */
  modelId?: string;
  /** Default: api.elevenlabs.io */
  endpoint?: string;
  /** Custom fetch (fuer Tests). Default: globalThis.fetch */
  fetchImpl?: typeof fetch;
}

const DEFAULT_VOICE_ID = "onwK4e9ZLuTAKqWW03F9"; // ElevenLabs "Daniel" (DE)
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";
const DEFAULT_ENDPOINT = "https://api.elevenlabs.io";
const SAMPLE_RATE = 24000;
const OUTPUT_FORMAT = "pcm_24000";

export class ElevenLabsTTSProvider implements ITTSProvider {
  private apiKey: string;
  private defaultVoiceId: string;
  private modelId: string;
  private endpoint: string;
  private fetchImpl: typeof fetch | undefined;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.defaultVoiceId = config.defaultVoiceId ?? DEFAULT_VOICE_ID;
    this.modelId = config.modelId ?? DEFAULT_MODEL_ID;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.fetchImpl = config.fetchImpl;
  }

  async *synthesizeStream(
    text: string,
    options?: TTSOptions,
  ): AsyncIterable<TTSChunk> {
    if (!this.apiKey) {
      throw new Error(
        "ELEVENLABS_API_KEY missing — provide via ElevenLabsConfig.apiKey",
      );
    }
    if (text.trim().length === 0) return;

    const voiceId = options?.voiceId ?? this.defaultVoiceId;
    const url = `${this.endpoint}/v1/text-to-speech/${voiceId}/stream?output_format=${OUTPUT_FORMAT}`;

    const f = this.fetchImpl ?? globalThis.fetch;
    const response = await f(url, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/pcm",
      },
      body: JSON.stringify({
        text,
        model_id: this.modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`ElevenLabs API ${response.status}: ${errText}`);
    }
    if (!response.body) {
      throw new Error("ElevenLabs response has no body");
    }

    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.length > 0) {
          yield { audio: value, sampleRate: SAMPLE_RATE };
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
