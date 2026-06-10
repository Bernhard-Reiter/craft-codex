/**
 * Phase E route handlers — invoked directly with Request objects.
 * No API keys in the test env → the routes must degrade exactly as designed:
 * answer works (template), tts/stt report 503, health reflects it.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GET as health } from "./health/route";
import { POST as answer } from "./answer/route";
import { POST as tts } from "./tts/route";
import { POST as stt } from "./stt/route";

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.TTS_PROVIDER;
  delete process.env.ANTHROPIC_API_KEY;
});

describe("GET /api/voice/health", () => {
  it("reports template-answer and no stt/tts without keys", async () => {
    const res = await health();
    const body = await res.json();
    expect(body).toEqual({ ok: true, stt: false, tts: false, ttsProvider: null, answer: "template" });
  });

  it("prefers gemini when its key is present (bake-off default)", async () => {
    process.env.GEMINI_API_KEY = "g";
    process.env.ELEVENLABS_API_KEY = "e";
    const body = await (await health()).json();
    expect(body.ttsProvider).toBe("gemini");
    expect(body.tts).toBe(true);
  });

  it("TTS_PROVIDER=elevenlabs overrides the auto pick", async () => {
    process.env.GEMINI_API_KEY = "g";
    process.env.ELEVENLABS_API_KEY = "e";
    process.env.TTS_PROVIDER = "elevenlabs";
    const body = await (await health()).json();
    expect(body.ttsProvider).toBe("elevenlabs");
  });
});

describe("POST /api/voice/answer", () => {
  it("answers from the local corpus WITHOUT any API key (offline brain)", async () => {
    const res = await answer(
      new Request("http://t/api/voice/answer", {
        method: "POST",
        body: JSON.stringify({ question: "Wie reisse ich mit dem Streichmass an" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { text: string; mode: string };
    expect(body.mode).toBe("template");
    expect(body.text.length).toBeGreaterThan(20);
  });

  it("rejects empty and oversized questions", async () => {
    const empty = await answer(
      new Request("http://t", { method: "POST", body: JSON.stringify({ question: " " }) }),
    );
    expect(empty.status).toBe(400);
    const huge = await answer(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({ question: "x".repeat(501) }),
      }),
    );
    expect(huge.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const res = await answer(new Request("http://t", { method: "POST", body: "{nope" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/voice/tts", () => {
  it("returns 503 tts_unavailable without ELEVENLABS_API_KEY", async () => {
    const res = await tts(
      new Request("http://t", { method: "POST", body: JSON.stringify({ text: "Hallo" }) }),
    );
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe("tts_unavailable");
  });
});

describe("POST /api/voice/stt", () => {
  it("returns 503 stt_unavailable without OPENAI_API_KEY", async () => {
    const res = await stt(
      new Request("http://t", { method: "POST", body: new Uint8Array([0, 0]) }),
    );
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe("stt_unavailable");
  });
});
