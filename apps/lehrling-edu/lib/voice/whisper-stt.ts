import type { ISTTProvider, STTChunk } from "@voai/lehrlings-core";

/**
 * OpenAI/Groq Whisper STT Provider (Phase D real).
 *
 * Akzeptiert PCM-Int16-Bytes (z.B. von MicRecorder), wrappt in WAV-Header,
 * POSTet als multipart/form-data an Whisper transcriptions endpoint und
 * liefert einen einzelnen finalen STTChunk zurueck.
 *
 * NICHT streaming (gibt nur einen finalen Chunk am Ende). Phase D+ kann
 * Realtime-API (WebSocket) ergaenzen fuer interim transcripts.
 *
 * **Dormant ohne API-Key:** transcribeStream wirft erst beim Call.
 */
export interface WhisperConfig {
  apiKey: string;
  /** Default: OpenAI Whisper-1. Groq: "whisper-large-v3-turbo" via Groq-endpoint */
  model?: string;
  /** Default: api.openai.com/v1/audio/transcriptions. Groq alternative funktioniert auch. */
  endpoint?: string;
  /** ISO 639-1, default "de" */
  language?: string;
  /** Input PCM Sample-Rate. Default: 16000 */
  sampleRate?: number;
  /** Custom fetch (fuer Tests). Default: globalThis.fetch */
  fetchImpl?: typeof fetch;
}

const DEFAULT_MODEL = "whisper-1";
const DEFAULT_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_LANGUAGE = "de";
const DEFAULT_SAMPLE_RATE = 16000;

export class WhisperSTTProvider implements ISTTProvider {
  private apiKey: string;
  private model: string;
  private endpoint: string;
  private language: string;
  private sampleRate: number;
  private fetchImpl: typeof fetch | undefined;

  constructor(config: WhisperConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.language = config.language ?? DEFAULT_LANGUAGE;
    this.sampleRate = config.sampleRate ?? DEFAULT_SAMPLE_RATE;
    this.fetchImpl = config.fetchImpl;
  }

  async *transcribeStream(
    audioStream: ReadableStream<Uint8Array>,
  ): AsyncIterable<STTChunk> {
    if (!this.apiKey) {
      throw new Error(
        "OPENAI_API_KEY missing — provide via WhisperConfig.apiKey",
      );
    }

    const pcmBytes = await drainStream(audioStream);
    if (pcmBytes.length === 0) return;

    const wavBlob = pcmToWavBlob(pcmBytes, this.sampleRate);
    const form = new FormData();
    form.append("file", wavBlob, "audio.wav");
    form.append("model", this.model);
    form.append("language", this.language);
    form.append("response_format", "json");

    const f = this.fetchImpl ?? globalThis.fetch;
    const response = await f(this.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Whisper API ${response.status}: ${text}`);
    }
    const json = (await response.json()) as { text?: string };
    const text = (json.text ?? "").trim();
    if (text.length === 0) return;

    yield { text, isFinal: true, confidence: 0.95 };
  }
}

async function drainStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    let result = await reader.read();
    while (!result.done) {
      if (result.value && result.value.length > 0) {
        chunks.push(result.value);
        total += result.value.length;
      }
      result = await reader.read();
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Wrappt PCM Int16-LE Bytes in einen Mono-WAV-Container.
 *
 * WAV-Header: 44 Bytes (RIFF + fmt + data chunks). Konvention nach
 * WAVE-PCM-Spec, Microsoft.
 */
export function pcmToWavBlob(pcm: Uint8Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Cast via BlobPart-Array — Uint8Array.buffer kann SharedArrayBuffer sein,
  // Blob akzeptiert das aber zur Laufzeit; TS DOM-Lib ist hier zu streng.
  return new Blob([header, pcm] as BlobPart[], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, ascii: string): void {
  for (let i = 0; i < ascii.length; i++) {
    view.setUint8(offset + i, ascii.charCodeAt(i));
  }
}
