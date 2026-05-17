import { describe, it, expect, vi } from "vitest";
import { ElevenLabsTTSProvider } from "./elevenlabs-tts";

function pcmResponse(chunks: Uint8Array[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

async function collect(
  iter: AsyncIterable<{ audio: Uint8Array; sampleRate: number }>,
) {
  const out: Array<{ audio: Uint8Array; sampleRate: number }> = [];
  for await (const c of iter) out.push(c);
  return out;
}

describe("ElevenLabsTTSProvider", () => {
  it("throws when apiKey missing", async () => {
    const p = new ElevenLabsTTSProvider({ apiKey: "" });
    await expect(collect(p.synthesizeStream("Hallo"))).rejects.toThrow(
      /API_KEY/,
    );
  });

  it("empty text yields zero chunks (no API call)", async () => {
    const fetchImpl = vi.fn();
    const p = new ElevenLabsTTSProvider({ apiKey: "sk-x", fetchImpl });
    const chunks = await collect(p.synthesizeStream("   "));
    expect(chunks).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls correct endpoint with default voice + model", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse([new Uint8Array([1, 2, 3])]));
    const p = new ElevenLabsTTSProvider({ apiKey: "sk-x", fetchImpl });
    await collect(p.synthesizeStream("Wie reisse ich an"));
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toMatch(/text-to-speech\/onwK4e9ZLuTAKqWW03F9\/stream/);
    expect(url).toContain("output_format=pcm_24000");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.text).toBe("Wie reisse ich an");
    expect(body.model_id).toBe("eleven_flash_v2_5");
  });

  it("respects TTSOptions.voiceId override", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse([new Uint8Array([0])]));
    const p = new ElevenLabsTTSProvider({ apiKey: "sk-x", fetchImpl });
    await collect(p.synthesizeStream("X", { voiceId: "custom-voice" }));
    const [url] = fetchImpl.mock.calls[0]!;
    expect(url as string).toMatch(/text-to-speech\/custom-voice\/stream/);
  });

  it("yields each PCM chunk with sampleRate 24000", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        pcmResponse([
          new Uint8Array([1, 2, 3, 4]),
          new Uint8Array([5, 6, 7, 8]),
          new Uint8Array([9, 10]),
        ]),
      );
    const p = new ElevenLabsTTSProvider({ apiKey: "sk-x", fetchImpl });
    const chunks = await collect(p.synthesizeStream("test"));
    expect(chunks).toHaveLength(3);
    chunks.forEach((c) => expect(c.sampleRate).toBe(24000));
    expect(chunks[0]!.audio).toEqual(new Uint8Array([1, 2, 3, 4]));
    expect(chunks[2]!.audio).toEqual(new Uint8Array([9, 10]));
  });

  it("throws on non-200 response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("rate_limited", { status: 429 }));
    const p = new ElevenLabsTTSProvider({ apiKey: "sk-x", fetchImpl });
    await expect(collect(p.synthesizeStream("Hi"))).rejects.toThrow(/429/);
  });

  it("custom endpoint + modelId honored", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse([new Uint8Array([0])]));
    const p = new ElevenLabsTTSProvider({
      apiKey: "sk-x",
      endpoint: "https://eu.example.com",
      modelId: "eleven_multilingual_v2",
      defaultVoiceId: "alt-voice",
      fetchImpl,
    });
    await collect(p.synthesizeStream("Hi"));
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url as string).toContain(
      "https://eu.example.com/v1/text-to-speech/alt-voice",
    );
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model_id).toBe("eleven_multilingual_v2");
  });

  it("includes xi-api-key header", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(pcmResponse([new Uint8Array([0])]));
    const p = new ElevenLabsTTSProvider({ apiKey: "sk-abc", fetchImpl });
    await collect(p.synthesizeStream("Hi"));
    const [, init] = fetchImpl.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["xi-api-key"]).toBe("sk-abc");
  });
});
