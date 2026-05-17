/**
 * Voice-Provider-Interfaces.
 *
 * Implementierungen leben in apps/lehrling-edu (Whisper API, ElevenLabs Standard-Voice DE).
 * Open-Core hat KEINE konkreten API-Calls.
 */

export interface STTChunk {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface ISTTProvider {
  /** Streamt Audio-Chunks zum Server, yields STTChunk-Stream */
  transcribeStream(
    audioStream: ReadableStream<Uint8Array>,
  ): AsyncIterable<STTChunk>;
}

export interface TTSChunk {
  audio: Uint8Array;
  /** PCM-Samplerate (z.B. 24000) */
  sampleRate: number;
}

export interface ITTSProvider {
  /**
   * Generiert TTS-Audio als Stream.
   * MVP: ElevenLabs Flash v2 mit Standard-Voice DE.
   */
  synthesizeStream(text: string, options?: TTSOptions): AsyncIterable<TTSChunk>;
}

export interface TTSOptions {
  voiceId?: string;
  /** SSML support (für Pausen, Betonung) */
  ssml?: boolean;
}

export interface VoicePipelineState {
  status: "idle" | "listening" | "thinking" | "speaking";
  currentQuery?: string;
  currentResponse?: string;
  latencyMs?: {
    stt?: number;
    llm?: number;
    tts?: number;
  };
}

export type VoicePipelineListener = (state: VoicePipelineState) => void;
