/**
 * OpenAI TTS provider (Phase E option C — the LIVE Meister voice).
 *
 * Warum über Gemini: Latenz + Natürlichkeit. gpt-4o-mini-tts / tts-1 antworten
 * in ~1–2 s (Gemini ~7,5 s — genau der Delay, den Bernhard im XR-Anreiss-Modus
 * gespürt hat) und klingen für Hochdeutsch natürlicher. Entscheidend:
 * `response_format: "pcm"` liefert rohes 24 kHz, 16-bit, mono, little-endian
 * PCM — exakt das Wire-Format, das unser TTS-Cache + pcm-player ohnehin
 * sprechen. Drop-in, kein Re-Encoding.
 *
 * gpt-4o-mini-tts nimmt zusätzlich ein freitextliches `instructions`-Feld, mit
 * dem sich der Tonfall steuern lässt ("ruhiger Werkstattmeister, der einem
 * Lehrling geduldig erklärt").
 *
 * Läuft auf dem EXISTIERENDEN OPENAI_API_KEY (schon für Whisper-STT genutzt) —
 * kein neuer Vendor-Account.
 *
 * API: POST /v1/audio/speech → roher Binär-Body (NICHT JSON wie bei Gemini).
 */

import type { ITTSProvider, TTSChunk, TTSOptions } from "@craft-codex/core";

type FetchLike = typeof globalThis.fetch;

export interface OpenAITTSConfig {
  apiKey: string;
  /** Default: gpt-4o-mini-tts (steuerbar, natürlich). "tts-1" = schnellste. */
  model?: string;
  /** Default-Stimme "onyx" (warm, männlich — passt zum Meister). */
  defaultVoice?: string;
  /** Tonfall-Steuerung (nur gpt-4o-*-tts; tts-1/-hd ignorieren das Feld). */
  instructions?: string;
  endpoint?: string;
  fetchImpl?: FetchLike;
}

const DEFAULT_MODEL = "gpt-4o-mini-tts";
// "verse" = sehr expressive, dynamische Stimme (Bernhards Wahl) — bringt die
// Begeisterung fürs Handwerk besser rüber als die brave "onyx"/"ash". Per
// OPENAI_TTS_VOICE überschreibbar (Alternativen: "ash", "ballad", "coral", "nova").
const DEFAULT_VOICE = "verse";
const DEFAULT_ENDPOINT = "https://api.openai.com";
/** response_format "pcm" ist bei OpenAI immer 24 kHz, 16-bit, mono, LE. */
const PCM_SAMPLE_RATE = 24000;
const DEFAULT_INSTRUCTIONS =
  "Sprich lebendig, warm und mit echter Begeisterung fürs Handwerk — wie ein " +
  "junger, mitreißender Tischlermeister, der seinem Lehrling Freude am Werken " +
  "vermittelt. Energisch und motivierend, natürliches bis leicht zügiges Tempo, " +
  "klares Hochdeutsch. Klinge nie monoton oder müde, sondern neugierig und " +
  "voller Tatendrang — als würdest du am liebsten sofort die Säge ansetzen.";

export class OpenAITTSProvider implements ITTSProvider {
  private apiKey: string;
  private model: string;
  private defaultVoice: string;
  private instructions: string;
  private endpoint: string;
  private fetchImpl: FetchLike;

  constructor(config: OpenAITTSConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.defaultVoice = config.defaultVoice ?? DEFAULT_VOICE;
    this.instructions = config.instructions ?? DEFAULT_INSTRUCTIONS;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch;
  }

  async *synthesizeStream(text: string, options?: TTSOptions): AsyncIterable<TTSChunk> {
    if (!this.apiKey) throw new Error("OpenAITTSProvider: apiKey missing");
    const voice = options?.voiceId ?? this.defaultVoice;
    const url = `${this.endpoint}/v1/audio/speech`;

    // `instructions` versteht nur die gpt-4o-Familie; tts-1/-hd würden es als
    // unbekanntes Feld ablehnen → nur dort mitschicken.
    const supportsInstructions = this.model.startsWith("gpt-4o");
    const body: Record<string, unknown> = {
      model: this.model,
      voice,
      input: text,
      response_format: "pcm",
    };
    if (supportsInstructions && this.instructions) {
      body.instructions = this.instructions;
    }

    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`OpenAITTS HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const audio = new Uint8Array(await res.arrayBuffer());
    if (audio.length === 0) throw new Error("OpenAITTS: empty audio response");

    yield { audio, sampleRate: PCM_SAMPLE_RATE };
  }
}
