import type { ISTTProvider, STTChunk } from "@craft-codex/core";

/**
 * Mock-STT-Provider fuer Tests + Demo ohne API-Key.
 *
 * Konsumiert audioStream (ignoriert Bytes), liefert vorgegebene Chunks
 * mit konfigurierbarem Delay zurueck. Phase C+ ersetzt durch echten
 * Whisper-streaming-Provider.
 */
export interface MockSTTConfig {
  /** Geplante Transcript-Chunks (final + interim) */
  chunks: STTChunk[];
  /** Delay zwischen Chunks (ms) — default 50 */
  chunkDelayMs?: number;
}

export class MockSTTProvider implements ISTTProvider {
  private config: MockSTTConfig;

  constructor(config: MockSTTConfig) {
    this.config = { chunkDelayMs: 50, ...config };
  }

  async *transcribeStream(
    audioStream: ReadableStream<Uint8Array>,
  ): AsyncIterable<STTChunk> {
    const reader = audioStream.getReader();
    try {
      let result = await reader.read();
      while (!result.done) {
        result = await reader.read();
      }
    } finally {
      reader.releaseLock();
    }

    for (const chunk of this.config.chunks) {
      if (this.config.chunkDelayMs && this.config.chunkDelayMs > 0) {
        await new Promise((r) =>
          setTimeout(r, this.config.chunkDelayMs),
        );
      }
      yield chunk;
    }
  }
}

/** Hilfs-Factory fuer ein einzelnes finales Transcript (haeufiger Test-Case). */
export function mockSttFromText(text: string, confidence = 0.95): MockSTTProvider {
  return new MockSTTProvider({
    chunks: [{ text, isFinal: true, confidence }],
    chunkDelayMs: 0,
  });
}
