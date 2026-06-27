/**
 * OpenAITTSProvider — fetch mocked, no live API.
 */

import { describe, it, expect } from "vitest";
import { OpenAITTSProvider } from "./openai-tts";

type FetchLike = typeof globalThis.fetch;

function audioResponse(bytes: number[]): Response {
  return new Response(new Uint8Array(bytes), { status: 200 });
}

describe("OpenAITTSProvider", () => {
  it("posts to /v1/audio/speech with pcm + instructions and returns 24kHz PCM", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: unknown, init?: RequestInit) => {
      captured = { url: String(url), init: init! };
      return audioResponse([1, 2, 3, 4]);
    }) as FetchLike;

    const tts = new OpenAITTSProvider({ apiKey: "sk-test", fetchImpl });
    const chunks = [];
    for await (const c of tts.synthesizeStream("Hallo Werkstatt")) chunks.push(c);

    expect(captured!.url).toBe("https://api.openai.com/v1/audio/speech");
    const headers = captured!.init.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer sk-test");
    const body = JSON.parse(String(captured!.init.body));
    expect(body.model).toBe("gpt-4o-mini-tts");
    expect(body.voice).toBe("onyx");
    expect(body.input).toBe("Hallo Werkstatt");
    expect(body.response_format).toBe("pcm");
    expect(typeof body.instructions).toBe("string");
    expect(body.instructions.length).toBeGreaterThan(10);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.sampleRate).toBe(24000);
    expect(Array.from(chunks[0]?.audio ?? [])).toEqual([1, 2, 3, 4]);
  });

  it("honors voice override + custom model and omits instructions for tts-1", async () => {
    let body: { model?: string; voice?: string; instructions?: unknown } = {};
    const fetchImpl = (async (_u: unknown, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return audioResponse([0, 0]);
    }) as FetchLike;

    const tts = new OpenAITTSProvider({ apiKey: "k", model: "tts-1", defaultVoice: "echo", fetchImpl });
    const chunks = [];
    for await (const c of tts.synthesizeStream("x", { voiceId: "nova" })) chunks.push(c);

    expect(body.model).toBe("tts-1");
    expect(body.voice).toBe("nova"); // voiceId override schlägt defaultVoice
    expect(body.instructions).toBeUndefined(); // tts-1 unterstützt es nicht
    expect(chunks[0]?.sampleRate).toBe(24000);
  });

  it("throws with status on HTTP errors", async () => {
    const tts = new OpenAITTSProvider({
      apiKey: "k",
      fetchImpl: (async () => new Response("rate limit", { status: 429 })) as FetchLike,
    });
    await expect(async () => {
      for await (const _ of tts.synthesizeStream("x")) void _;
    }).rejects.toThrow("OpenAITTS HTTP 429");
  });

  it("throws on an empty audio body", async () => {
    const tts = new OpenAITTSProvider({
      apiKey: "k",
      fetchImpl: (async () => audioResponse([])) as FetchLike,
    });
    await expect(async () => {
      for await (const _ of tts.synthesizeStream("x")) void _;
    }).rejects.toThrow("empty audio");
  });

  it("throws when apiKey is missing", async () => {
    const tts = new OpenAITTSProvider({ apiKey: "" });
    await expect(async () => {
      for await (const _ of tts.synthesizeStream("x")) void _;
    }).rejects.toThrow("apiKey missing");
  });
});
