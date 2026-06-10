/**
 * Gemini dialog brain — fetch mocked. The contract that makes FOLLOW-UPS work:
 * history goes into `contents` as alternating user/model turns, and short
 * follow-ups are guarded/retrieved WITH the previous question as context.
 */

import { describe, it, expect } from "vitest";
import { createGeminiAnswerFn, guardQuery, type DialogTurn } from "./gemini-answer";
import type { IRAGProvider, ITopicGuard } from "@craft-codex/core";

type FetchLike = typeof globalThis.fetch;

function geminiText(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200 },
  );
}

async function collect(it: AsyncIterable<string> | Promise<string>): Promise<string> {
  if (typeof (it as Promise<string>).then === "function") return (it as Promise<string>);
  let out = "";
  for await (const c of it as AsyncIterable<string>) out += c;
  return out;
}

const HISTORY: DialogTurn[] = [
  { question: "Welcher Schwalbenwinkel fuer Hartholz?", answer: "1 zu 6 ist Standard fuer Hartholz." },
];

describe("guardQuery (follow-up context)", () => {
  it("prepends the previous question for short follow-ups", () => {
    expect(guardQuery("und bei Eiche?", HISTORY)).toBe(
      "Welcher Schwalbenwinkel fuer Hartholz? und bei Eiche?",
    );
  });
  it("leaves long questions and empty history untouched", () => {
    expect(guardQuery("und bei Eiche?", [])).toBe("und bei Eiche?");
    const long = "Wie genau pruefe ich die Passung der Schwalben am fertigen Werkstueck?";
    expect(guardQuery(long, HISTORY)).toBe(long);
  });
});

describe("createGeminiAnswerFn", () => {
  it("sends history as alternating user/model turns + RAG context", async () => {
    let body: {
      systemInstruction?: { parts: Array<{ text: string }> };
      contents?: Array<{ role: string; parts: Array<{ text: string }> }>;
    } = {};
    const fetchImpl = (async (_u: unknown, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return geminiText("Bei Eiche bleibst du bei 1 zu 6.");
    }) as FetchLike;

    const rag: IRAGProvider = {
      query: async () => [
        { id: "d1", text: "Eiche ist Hartholz, Winkel 1:6.", score: 0.9, metadata: { title: "Holzkunde" } },
      ],
    } as unknown as IRAGProvider;

    const fn = createGeminiAnswerFn({ apiKey: "k", rag, history: HISTORY, fetchImpl });
    const out = await collect(fn("und bei Eiche?"));

    expect(out).toBe("Bei Eiche bleibst du bei 1 zu 6.");
    const contents = body.contents!;
    expect(contents).toHaveLength(3); // user(hist) + model(hist) + user(current)
    expect(contents[0]).toMatchObject({ role: "user" });
    expect(contents[1]).toMatchObject({ role: "model" });
    expect(contents[2]?.role).toBe("user");
    expect(contents[2]?.parts[0]?.text).toContain("und bei Eiche?");
    expect(contents[2]?.parts[0]?.text).toContain("Holzkunde"); // RAG context attached
    expect(body.systemInstruction?.parts[0]?.text).toContain("Tischler-Meister");
  });

  it("answers off-topic guard verdicts without calling the API", async () => {
    let called = false;
    const guard: ITopicGuard = {
      evaluate: async () => ({ decision: "off", score: 0 }),
    } as unknown as ITopicGuard;
    const fn = createGeminiAnswerFn({
      apiKey: "k",
      guard,
      fetchImpl: (async () => {
        called = true;
        return geminiText("x");
      }) as FetchLike,
    });
    const out = await collect(fn("Was kostet Bitcoin?"));
    expect(out).toContain("Werkstueck");
    expect(called).toBe(false);
  });

  it("throws with status on HTTP errors (console falls back locally)", async () => {
    const fn = createGeminiAnswerFn({
      apiKey: "k",
      fetchImpl: (async () => new Response("overloaded", { status: 503 })) as FetchLike,
    });
    await expect(collect(fn("Frage"))).rejects.toThrow("GeminiAnswer HTTP 503");
  });

  it("caps the history at the last 4 turns", async () => {
    let body: { contents?: unknown[] } = {};
    const fetchImpl = (async (_u: unknown, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return geminiText("ok");
    }) as FetchLike;
    const manyTurns: DialogTurn[] = Array.from({ length: 9 }, (_, i) => ({
      question: `F${i}`,
      answer: `A${i}`,
    }));
    const fn = createGeminiAnswerFn({ apiKey: "k", history: manyTurns, fetchImpl });
    await collect(fn("aktuelle Frage zur Schwalbenschwanzverbindung im Detail bitte"));
    expect(body.contents).toHaveLength(4 * 2 + 1);
  });
});
