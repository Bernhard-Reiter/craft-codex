/**
 * GeminiTTSProvider — fetch mocked, no live API.
 */

import { describe, it, expect } from "vitest";
import { GeminiTTSProvider } from "./gemini-tts";

type FetchLike = typeof globalThis.fetch;

function b64(bytes: number[]): string {
  return Buffer.from(bytes).toString("base64");
}

function geminiResponse(bytes: number[], rate = 24000): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { mimeType: `audio/L16;codec=pcm;rate=${rate}`, data: b64(bytes) } },
            ],
          },
        },
      ],
    }),
    { status: 200 },
  );
}

describe("GeminiTTSProvider", () => {
  it("posts to generateContent with AUDIO modality + voice and decodes PCM", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: unknown, init?: RequestInit) => {
      captured = { url: String(url), init: init! };
      return geminiResponse([1, 2, 3, 4], 24000);
    }) as FetchLike;

    const tts = new GeminiTTSProvider({ apiKey: "k", fetchImpl });
    const chunks = [];
    for await (const c of tts.synthesizeStream("Hallo Werkstatt")) chunks.push(c);

    expect(captured!.url).toContain("/models/gemini-3.1-flash-tts-preview:generateContent");
    const headers = captured!.init.headers as Record<string, string>;
    expect(headers["x-goog-api-key"]).toBe("k");
    const body = JSON.parse(String(captured!.init.body));
    expect(body.generationConfig.responseModalities).toEqual(["AUDIO"]);
    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Kore");
    expect(body.contents[0].parts[0].text).toBe("Hallo Werkstatt");

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.sampleRate).toBe(24000);
    expect(Array.from(chunks[0]?.audio ?? [])).toEqual([1, 2, 3, 4]);
  });

  it("honors voice override + custom model and parses non-default sample rates", async () => {
    let url = "";
    let body: { generationConfig?: { speechConfig?: { voiceConfig?: { prebuiltVoiceConfig?: { voiceName?: string } } } } } = {};
    const fetchImpl = (async (u: unknown, init?: RequestInit) => {
      url = String(u);
      body = JSON.parse(String(init?.body));
      return geminiResponse([0, 0], 16000);
    }) as FetchLike;

    const tts = new GeminiTTSProvider({ apiKey: "k", model: "gemini-2.5-pro-preview-tts", defaultVoice: "Charon", fetchImpl });
    const chunks = [];
    for await (const c of tts.synthesizeStream("x", { voiceId: "Puck" })) chunks.push(c);

    expect(url).toContain("gemini-2.5-pro-preview-tts");
    expect(body.generationConfig?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName).toBe("Puck");
    expect(chunks[0]?.sampleRate).toBe(16000);
  });

  it("throws with status on HTTP errors", async () => {
    const tts = new GeminiTTSProvider({
      apiKey: "k",
      fetchImpl: (async () => new Response("quota", { status: 429 })) as FetchLike,
    });
    await expect(async () => {
      for await (const _ of tts.synthesizeStream("x")) void _;
    }).rejects.toThrow("GeminiTTS HTTP 429");
  });

  it("throws when the response carries no audio part", async () => {
    const tts = new GeminiTTSProvider({
      apiKey: "k",
      fetchImpl: (async () =>
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "nur text" }] } }] }))) as FetchLike,
    });
    await expect(async () => {
      for await (const _ of tts.synthesizeStream("x")) void _;
    }).rejects.toThrow("no audio");
  });
});
