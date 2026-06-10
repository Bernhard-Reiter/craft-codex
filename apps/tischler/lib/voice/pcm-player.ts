/**
 * Browser PCM playback for TTSChunks (Int16 mono → WebAudio).
 *
 * Used for BOTH sources of real audio: the offline cache (/tts-cache/*.pcm)
 * and the server route (/api/voice/tts) — one player, identical format.
 * SSR-safe: every entry point no-ops without window/AudioContext.
 */

import type { TTSChunk } from "@craft-codex/core";

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

/** True when this environment can actually emit sound. */
export function canPlayAudio(): boolean {
  return getAudioContextCtor() !== null;
}

function int16ToFloat32(bytes: Uint8Array): Float32Array {
  // Tolerate odd byte counts from chunked transfers (drop the dangling byte).
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
  const out = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768;
  }
  return out;
}

/**
 * Play collected PCM chunks; resolves when playback finishes.
 * Returns false when there is nothing audible (mock silence stays silent).
 */
export async function playPcmChunks(chunks: ReadonlyArray<TTSChunk>): Promise<boolean> {
  const Ctor = getAudioContextCtor();
  if (!Ctor || chunks.length === 0) return false;

  const sampleRate = chunks[0]?.sampleRate ?? 24000;
  const totalBytes = chunks.reduce((n, c) => n + c.audio.length, 0);
  if (totalBytes < 2) return false;

  const joined = new Uint8Array(totalBytes);
  let off = 0;
  for (const c of chunks) {
    joined.set(c.audio, off);
    off += c.audio.length;
  }
  const samples = int16ToFloat32(joined);
  if (samples.length === 0) return false;

  const ctx = new Ctor({ sampleRate });
  try {
    const buffer = ctx.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
    return true;
  } finally {
    void ctx.close().catch(() => {});
  }
}
