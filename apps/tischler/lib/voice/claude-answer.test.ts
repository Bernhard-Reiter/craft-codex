import { describe, it, expect, vi } from "vitest";
import { getOffTopicReply } from "./voice-locale";
import { createClaudeAnswerFn } from "./claude-answer";
import { LocalRAGProvider } from "../rag/local-rag";
import { KeywordTopicGuard } from "../rag/topic-guard";
import { getDovetailCorpus } from "../rag/corpus/dovetail-corpus";

function makeSSEResponse(events: string[]): Response {
  const lines = events.map((e) => `data: ${e}`).join("\n\n");
  return new Response(lines, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function collect(iter: AsyncIterable<string>): Promise<string> {
  let acc = "";
  for await (const piece of iter) acc += piece;
  return acc;
}

describe("createClaudeAnswerFn", () => {
  it("throws when apiKey missing", async () => {
    const answer = createClaudeAnswerFn({ apiKey: "" });
    await expect(collect(answer("Frage"))).rejects.toThrow(/API_KEY/);
  });

  it("yields prompt-to-repeat on empty query", async () => {
    const fetchImpl = vi.fn();
    const answer = createClaudeAnswerFn({ apiKey: "sk-test", fetchImpl });
    const r = await collect(answer("   "));
    expect(r.toLowerCase()).toMatch(/nichts gehoert|noch einmal/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("yields off-topic message when guard returns off", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const guard = new KeywordTopicGuard({
      rag,
      blacklist: ["bitcoin"],
    });
    const fetchImpl = vi.fn();
    const answer = createClaudeAnswerFn({
      apiKey: "sk-test",
      guard,
      fetchImpl,
    });
    const r = await collect(answer("Wie kaufe ich Bitcoin"));
    // Kanonische Off-Topic-Antwort kommt aus voice-locale (eine Quelle fuer alle Pfade).
    expect(r).toBe(getOffTopicReply("de"));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls Claude API with system + user message + stream=true", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        makeSSEResponse([
          '{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hallo "}}',
          '{"type":"content_block_delta","delta":{"type":"text_delta","text":"Welt"}}',
          "[DONE]",
        ]),
      );
    const answer = createClaudeAnswerFn({
      apiKey: "sk-test",
      fetchImpl,
    });
    const r = await collect(answer("Wie reisse ich an"));
    expect(r).toBe("Hallo Welt");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const call = fetchImpl.mock.calls[0]!;
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.stream).toBe(true);
    expect(body.system).toContain("Tischler-Meister");
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[0].content).toContain("Wie reisse ich an");
  });

  it("includes RAG context in user message when rag provided", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        makeSSEResponse([
          '{"type":"content_block_delta","delta":{"type":"text_delta","text":"OK"}}',
          "[DONE]",
        ]),
      );
    const answer = createClaudeAnswerFn({
      apiKey: "sk-test",
      rag,
      fetchImpl,
    });
    await collect(answer("Streichmass Anrisslinie"));
    const body = JSON.parse(
      (fetchImpl.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.messages[0].content).toContain(
      "Kontext aus dem Lehrling-Korpus",
    );
    expect(body.messages[0].content).toMatch(/Streichmass|Anriss/);
  });

  it("throws on non-200 response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("rate_limited", { status: 429 }));
    const answer = createClaudeAnswerFn({ apiKey: "sk-test", fetchImpl });
    await expect(collect(answer("Frage"))).rejects.toThrow(/429/);
  });

  it("ignores malformed SSE events gracefully", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        makeSSEResponse([
          "{not valid json",
          '{"type":"ping"}',
          '{"type":"content_block_delta","delta":{"type":"text_delta","text":"Yo"}}',
          "[DONE]",
        ]),
      );
    const answer = createClaudeAnswerFn({ apiKey: "sk-test", fetchImpl });
    const r = await collect(answer("Frage"));
    expect(r).toBe("Yo");
  });

  it("uses custom model + endpoint when provided", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        makeSSEResponse([
          '{"type":"content_block_delta","delta":{"type":"text_delta","text":"X"}}',
          "[DONE]",
        ]),
      );
    const answer = createClaudeAnswerFn({
      apiKey: "sk-test",
      model: "claude-opus-4",
      endpoint: "https://custom.example.com/messages",
      fetchImpl,
    });
    await collect(answer("Frage"));
    const call = fetchImpl.mock.calls[0]!;
    expect(call[0]).toBe("https://custom.example.com/messages");
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.model).toBe("claude-opus-4");
  });
});
