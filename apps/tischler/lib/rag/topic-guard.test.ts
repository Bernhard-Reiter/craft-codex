import { describe, it, expect } from "vitest";
import type { IRAGProvider, RAGDocument } from "@craft-codex/core";
import { KeywordTopicGuard } from "./topic-guard";

/** Stub-RAG mit fester Top-Hit-Score (Blacklist greift VOR der Score-Logik). */
function stubRag(score: number): IRAGProvider {
  return {
    async query(): Promise<RAGDocument[]> {
      return [{ id: "x", text: "", metadata: { source: "stub" }, score }];
    },
    async health() {
      return { ok: true };
    },
  };
}

describe("KeywordTopicGuard — Blacklist (normalisiert)", () => {
  it("fängt direkten Blacklist-Treffer", async () => {
    const g = new KeywordTopicGuard({ rag: stubRag(0.9), blacklist: ["bitcoin"] });
    const v = await g.evaluate("Soll ich in bitcoin investieren?");
    expect(v.decision).toBe("off");
    expect(v.layer).toBe("keyword");
  });

  it("fängt auch getrennt geschriebene Umgehung ('bit coin')", async () => {
    const g = new KeywordTopicGuard({ rag: stubRag(0.9), blacklist: ["bitcoin"] });
    const v = await g.evaluate("erzähl mir was über bit coin");
    expect(v.decision).toBe("off");
  });

  it("lässt on-topic durch, wenn keine Blacklist + hoher Score", async () => {
    const g = new KeywordTopicGuard({ rag: stubRag(0.9), onTopicMin: 0.25, blacklist: [] });
    const v = await g.evaluate("Wie reiße ich den Schwalbenschwanz an?");
    expect(v.decision).toBe("on");
  });
});
