import type { ITTSProvider, TTSChunk, TTSOptions } from "@voai/lehrlings-core";

/**
 * Mock-TTS-Provider — liefert PCM-Stille-Frames in einer Laenge proportional
 * zur Text-Laenge zurueck. Fuer Tests + offline-Demos ohne ElevenLabs-Key.
 *
 * Phase C+ ersetzt durch ElevenLabs-Flash-v2 (Standard-Voice DE).
 */
export interface MockTTSConfig {
  /** PCM-Samplerate, default 24000 (ElevenLabs Flash) */
  sampleRate?: number;
  /** Sekunden Audio pro Zeichen — default 0.06 (ungefaehr deutsche Sprechgeschwindigkeit) */
  secondsPerChar?: number;
  /** Frame-Groesse in Samples — default 1024 */
  frameSize?: number;
}

export class MockTTSProvider implements ITTSProvider {
  private sampleRate: number;
  private secondsPerChar: number;
  private frameSize: number;

  constructor(config: MockTTSConfig = {}) {
    this.sampleRate = config.sampleRate ?? 24000;
    this.secondsPerChar = config.secondsPerChar ?? 0.06;
    this.frameSize = config.frameSize ?? 1024;
  }

  async *synthesizeStream(
    text: string,
    _options?: TTSOptions,
  ): AsyncIterable<TTSChunk> {
    const totalSeconds = Math.max(0.1, text.length * this.secondsPerChar);
    const totalSamples = Math.ceil(totalSeconds * this.sampleRate);
    let emitted = 0;

    while (emitted < totalSamples) {
      const remaining = totalSamples - emitted;
      const size = Math.min(this.frameSize, remaining);
      const audio = new Uint8Array(size * 2);
      yield { audio, sampleRate: this.sampleRate };
      emitted += size;
    }
  }
}
