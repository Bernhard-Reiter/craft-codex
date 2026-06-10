/**
 * Phase E client providers — fetch is mocked, no live routes needed.
 */

import { describe, it, expect } from "vitest";
import {
  probeServerVoice,
  ServerTTSProvider,
  ServerSTTProvider,
  createServerAnswerFn,
} from "./server-providers";

type FetchLike = typeof globalThis.fetch;

function fetchReturning(res: Response): FetchLike {
  return (async () => res) as FetchLike;
}

describe("probeServerVoice", () => {
  it("returns capabilities from a healthy route", async () => {
    const f = fetchReturning(
      new Response(JSON.stringify({ ok: true, stt: false, tts: true, answer: "template" })),
    );
    const health = await probeServerVoice(f);
    expect(health).toEqual({ ok: true, stt: false, tts: true, answer: "template" });
  });

  it("returns null on HTTP errors (static hosting without API routes)", async () => {
    const health = await probeServerVoice(fetchReturning(new Response("nope", { status: 404 })));
    expect(health).toBeNull();
  });

  it("returns null when fetch rejects (fully offline)", async () => {
    const f = (async () => {
      throw new Error("offline");
    }) as FetchLike;
    expect(await probeServerVoice(f)).toBeNull();
  });
});

describe("ServerTTSProvider", () => {
  it("yields one PCM chunk with the sample rate from the header", async () => {
    const pcm = new Uint8Array([1, 2, 3, 4]);
    const f = fetchReturning(
      new Response(pcm, { status: 200, headers: { "x-sample-rate": "16000" } }),
    );
    const tts = new ServerTTSProvider(f);
    const chunks = [];
    for await (const c of tts.synthesizeStream("Hallo")) chunks.push(c);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.sampleRate).toBe(16000);
    expect(Array.from(chunks[0]?.audio ?? [])).toEqual([1, 2, 3, 4]);
  });

  it("throws tts_unavailable on 503 so the caller can fall back", async () => {
    const tts = new ServerTTSProvider(fetchReturning(new Response("{}", { status: 503 })));
    await expect(async () => {
      for await (const _ of tts.synthesizeStream("x")) void _;
    }).rejects.toThrow("tts_unavailable");
  });
});

describe("ServerSTTProvider", () => {
  it("collects the mic stream, posts it, and yields the final transcript", async () => {
    let postedBytes = 0;
    const f = (async (_url: unknown, init?: RequestInit) => {
      postedBytes = (init?.body as Uint8Array).length;
      return new Response(JSON.stringify({ text: "wie saege ich" }), { status: 200 });
    }) as FetchLike;

    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array([1, 2]));
        c.enqueue(new Uint8Array([3]));
        c.close();
      },
    });
    const stt = new ServerSTTProvider(f);
    const chunks = [];
    for await (const c of stt.transcribeStream(stream)) chunks.push(c);
    expect(postedBytes).toBe(3);
    expect(chunks).toEqual([{ text: "wie saege ich", isFinal: true }]);
  });

  it("throws stt_unavailable on 503", async () => {
    const stt = new ServerSTTProvider(fetchReturning(new Response("{}", { status: 503 })));
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.close();
      },
    });
    await expect(async () => {
      for await (const _ of stt.transcribeStream(stream)) void _;
    }).rejects.toThrow("stt_unavailable");
  });
});

describe("createServerAnswerFn", () => {
  it("returns the answer text", async () => {
    const fn = createServerAnswerFn(
      fetchReturning(new Response(JSON.stringify({ text: "Antwort", mode: "template" }))),
    );
    expect(await fn("frage")).toBe("Antwort");
  });

  it("throws on HTTP errors so the console can use the local fallback", async () => {
    const fn = createServerAnswerFn(fetchReturning(new Response("{}", { status: 502 })));
    await expect(fn("frage")).rejects.toThrow("answer_http_502");
  });
});
