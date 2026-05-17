import type { ITTSProvider, TTSChunk, TTSOptions } from "@craft-codex/core";

/**
 * Cached TTS Provider — checkt zuerst lokalen Cache, fällt zurück auf
 * Upstream-Provider wenn Cache-Miss.
 *
 * Use-Case: Phase D Backup-Plan Stufe 3 (ElevenLabs down) — top-20
 * vorgenerierte Audios offline verfuegbar via /tts-cache/{hash}.pcm.
 *
 * Manifest format (public/tts-cache/manifest.json):
 *   { "version": 1, "entries": { "<sha256>": { "text": "...", "file": "/tts-cache/<hash>.pcm", "sampleRate": 24000 } } }
 */
export interface CachedTTSConfig {
  /** Upstream-Provider fuer Cache-Misses (z.B. ElevenLabsTTSProvider) */
  upstream: ITTSProvider;
  /** Manifest mit cache entries. Geladen aus public/tts-cache/manifest.json. */
  manifest: TTSCacheManifest;
  /** Custom fetch fuer cache-PCM files. Default: globalThis.fetch */
  fetchImpl?: typeof fetch;
  /** Base URL fuer PCM-Files. Default: "" (relative) */
  baseUrl?: string;
}

export interface TTSCacheManifestEntry {
  text: string;
  file: string;
  sampleRate: number;
}

export interface TTSCacheManifest {
  version: 1;
  entries: Record<string, TTSCacheManifestEntry>;
}

export const EMPTY_MANIFEST: TTSCacheManifest = {
  version: 1,
  entries: {},
};

/**
 * SHA-256 hex hash eines Strings — gleicher Hash wie scripts/build-tts-cache.ts
 * verwenden muss. Browser-API: crypto.subtle.digest.
 */
export async function hashText(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class CachedTTSProvider implements ITTSProvider {
  private upstream: ITTSProvider;
  private manifest: TTSCacheManifest;
  private fetchImpl: typeof fetch | undefined;
  private baseUrl: string;

  constructor(config: CachedTTSConfig) {
    this.upstream = config.upstream;
    this.manifest = config.manifest;
    this.fetchImpl = config.fetchImpl;
    this.baseUrl = config.baseUrl ?? "";
  }

  async *synthesizeStream(
    text: string,
    options?: TTSOptions,
  ): AsyncIterable<TTSChunk> {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    const hash = await hashText(trimmed);
    const cached = this.manifest.entries[hash];

    if (cached) {
      yield* this.fetchCached(cached);
      return;
    }

    yield* this.upstream.synthesizeStream(text, options);
  }

  private async *fetchCached(
    entry: TTSCacheManifestEntry,
  ): AsyncIterable<TTSChunk> {
    // Path-validation: cache files MUST be under /tts-cache/ and contain
    // no protocol scheme. Guards against a malicious manifest that could
    // redirect to an external URL (SSRF-style). CORS already restricts
    // cross-origin fetches, but the principle of least surprise applies.
    if (!entry.file.startsWith("/tts-cache/") || entry.file.includes("://")) {
      throw new Error(`Invalid cache entry path: ${entry.file}`);
    }
    const f = this.fetchImpl ?? globalThis.fetch;
    const response = await f(`${this.baseUrl}${entry.file}`);
    if (!response.ok || !response.body) {
      throw new Error(`Cache fetch failed: ${entry.file} (${response.status})`);
    }
    const reader = response.body.getReader();
    try {
      let result = await reader.read();
      while (!result.done) {
        if (result.value && result.value.length > 0) {
          yield { audio: result.value, sampleRate: entry.sampleRate };
        }
        result = await reader.read();
      }
    } finally {
      reader.releaseLock();
    }
  }
}
