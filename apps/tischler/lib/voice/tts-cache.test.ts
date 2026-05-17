import { describe, it, expect, vi } from "vitest";
import {
  CachedTTSProvider,
  EMPTY_MANIFEST,
  hashText,
  type TTSCacheManifest,
} from "./tts-cache";
import type { ITTSProvider, TTSChunk } from "@craft-codex/core";

class StubUpstream implements ITTSProvider {
  public calls: string[] = [];
  async *synthesizeStream(text: string): AsyncIterable<TTSChunk> {
    this.calls.push(text);
    yield { audio: new Uint8Array([1, 2, 3]), sampleRate: 24000 };
  }
}

function pcmResponse(bytes: Uint8Array): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  });
  return new Response(stream, { status: 200 });
}

async function collect(iter: AsyncIterable<TTSChunk>): Promise<TTSChunk[]> {
  const out: TTSChunk[] = [];
  for await (const c of iter) out.push(c);
  return out;
}

describe("hashText", () => {
  it("produces stable SHA-256 hex hashes", async () => {
    const h1 = await hashText("Hello");
    const h2 = await hashText("Hello");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).toMatch(/^[0-9a-f]+$/);
  });

  it("different texts → different hashes", async () => {
    const h1 = await hashText("Hello");
    const h2 = await hashText("World");
    expect(h1).not.toBe(h2);
  });
});

describe("CachedTTSProvider", () => {
  it("empty text yields nothing", async () => {
    const upstream = new StubUpstream();
    const p = new CachedTTSProvider({
      upstream,
      manifest: EMPTY_MANIFEST,
    });
    const chunks = await collect(p.synthesizeStream("   "));
    expect(chunks).toEqual([]);
    expect(upstream.calls).toEqual([]);
  });

  it("cache MISS → falls back to upstream", async () => {
    const upstream = new StubUpstream();
    const p = new CachedTTSProvider({
      upstream,
      manifest: EMPTY_MANIFEST,
    });
    const chunks = await collect(p.synthesizeStream("Wie reisse ich an"));
    expect(chunks).toHaveLength(1);
    expect(upstream.calls).toEqual(["Wie reisse ich an"]);
  });

  it("cache HIT → fetched from manifest, no upstream call", async () => {
    const text = "Hallo Welt";
    const hash = await hashText(text);
    const manifest: TTSCacheManifest = {
      version: 1,
      entries: {
        [hash]: {
          text,
          file: "/tts-cache/test.pcm",
          sampleRate: 24000,
        },
      },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse(new Uint8Array([9, 8, 7])));
    const upstream = new StubUpstream();
    const p = new CachedTTSProvider({ upstream, manifest, fetchImpl });
    const chunks = await collect(p.synthesizeStream(text));
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.audio).toEqual(new Uint8Array([9, 8, 7]));
    expect(chunks[0]!.sampleRate).toBe(24000);
    expect(upstream.calls).toEqual([]); // upstream NICHT angesprochen
    expect(fetchImpl).toHaveBeenCalledWith("/tts-cache/test.pcm");
  });

  it("baseUrl prefix wird angewendet", async () => {
    const text = "X";
    const hash = await hashText(text);
    const manifest: TTSCacheManifest = {
      version: 1,
      entries: {
        [hash]: { text, file: "/tts-cache/x.pcm", sampleRate: 16000 },
      },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse(new Uint8Array([1])));
    const p = new CachedTTSProvider({
      upstream: new StubUpstream(),
      manifest,
      fetchImpl,
      baseUrl: "https://cdn.example.com",
    });
    await collect(p.synthesizeStream(text));
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://cdn.example.com/tts-cache/x.pcm",
    );
  });

  it("rejects manifest entry with protocol scheme (SSRF guard)", async () => {
    const text = "X";
    const hash = await hashText(text);
    const manifest: TTSCacheManifest = {
      version: 1,
      entries: {
        [hash]: {
          text,
          file: "https://attacker.example.com/exfil.pcm",
          sampleRate: 24000,
        },
      },
    };
    const fetchImpl = vi.fn();
    const p = new CachedTTSProvider({
      upstream: new StubUpstream(),
      manifest,
      fetchImpl,
    });
    await expect(collect(p.synthesizeStream(text))).rejects.toThrow(
      /Invalid cache entry path/,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects manifest entry outside /tts-cache/ (path-traversal guard)", async () => {
    const text = "Y";
    const hash = await hashText(text);
    const manifest: TTSCacheManifest = {
      version: 1,
      entries: {
        [hash]: { text, file: "/etc/passwd", sampleRate: 24000 },
      },
    };
    const fetchImpl = vi.fn();
    const p = new CachedTTSProvider({
      upstream: new StubUpstream(),
      manifest,
      fetchImpl,
    });
    await expect(collect(p.synthesizeStream(text))).rejects.toThrow(
      /Invalid cache entry path/,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("cache fetch fail → wirft (kein silent fallback)", async () => {
    const text = "X";
    const hash = await hashText(text);
    const manifest: TTSCacheManifest = {
      version: 1,
      entries: {
        [hash]: { text, file: "/tts-cache/missing.pcm", sampleRate: 24000 },
      },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 404 }));
    const p = new CachedTTSProvider({
      upstream: new StubUpstream(),
      manifest,
      fetchImpl,
    });
    await expect(collect(p.synthesizeStream(text))).rejects.toThrow(/404/);
  });

  it("trimmt query vor hash-lookup (whitespace-resistent)", async () => {
    const text = "Hallo";
    const hash = await hashText(text);
    const manifest: TTSCacheManifest = {
      version: 1,
      entries: {
        [hash]: { text, file: "/tts-cache/y.pcm", sampleRate: 24000 },
      },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse(new Uint8Array([1])));
    const p = new CachedTTSProvider({
      upstream: new StubUpstream(),
      manifest,
      fetchImpl,
    });
    await collect(p.synthesizeStream("  Hallo  "));
    expect(fetchImpl).toHaveBeenCalled();
  });
});
