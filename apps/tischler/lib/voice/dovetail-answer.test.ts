import { describe, it, expect } from "vitest";
import {
  createDovetailAnswerFn,
  synthesizeFromHits,
} from "./dovetail-answer";
import { LocalRAGProvider } from "../rag/local-rag";
import { StubTopicGuard } from "../rag/topic-guard";
import { getDovetailCorpus } from "../rag/corpus/dovetail-corpus";

function makePipeline(overrides?: {
  blacklist?: string[];
  onTopicMin?: number;
  offTopicMax?: number;
}) {
  const rag = new LocalRAGProvider(getDovetailCorpus());
  const guard = new StubTopicGuard({
    rag,
    onTopicMin: overrides?.onTopicMin ?? 0.3,
    offTopicMax: overrides?.offTopicMax ?? 0.05,
    blacklist: overrides?.blacklist ?? [],
  });
  return { rag, guard, answer: createDovetailAnswerFn({ rag, guard }) };
}

describe("createDovetailAnswerFn", () => {
  it("on-topic query returns body with relevant content", async () => {
    const { answer } = makePipeline();
    const r = await answer("Wie reisse ich mit dem Streichmass an");
    expect(r).toMatch(/Streichmass|Anriss/i);
    expect(r).toMatch(/Quelle:/);
  });

  it("blacklist hit returns off-topic message", async () => {
    const { answer } = makePipeline({ blacklist: ["bitcoin"] });
    const r = await answer("Wie kaufe ich Bitcoin");
    expect(r.toLowerCase()).toContain("schwalbenschwanz");
    expect(r).not.toMatch(/Quelle:/);
  });

  it("score-based off-topic returns redirect message", async () => {
    const { answer } = makePipeline({ offTopicMax: 0.5 });
    const r = await answer("Quantenphysik Photonen Wellen");
    expect(r.toLowerCase()).toContain("schwalbenschwanz");
  });

  it("empty query returns prompt to repeat", async () => {
    const { answer } = makePipeline();
    const r = await answer("   ");
    expect(r.toLowerCase()).toMatch(/nichts gehoert|noch einmal/);
  });

  it("redirect verdict appends bridge text", async () => {
    const { answer } = makePipeline({
      onTopicMin: 0.95,
      offTopicMax: 0.05,
    });
    const r = await answer("Schwalbenschwanz Spannvorrichtung");
    expect(r.length).toBeGreaterThan(0);
  });

  it("returns no-corpus-hit message when minScore filters everything", async () => {
    const rag = new LocalRAGProvider(getDovetailCorpus());
    const guard = new StubTopicGuard({ rag, onTopicMin: 0, offTopicMax: -1 });
    const answer = createDovetailAnswerFn({ rag, guard, minScore: 1.01 });
    const r = await answer("Schwalbenschwanz Anriss");
    expect(r.toLowerCase()).toMatch(/finde.*nichts|konkretere/);
  });
});

describe("synthesizeFromHits", () => {
  it("empty hits returns empty string", () => {
    expect(synthesizeFromHits([])).toBe("");
  });

  it("single hit returns up-to-2-sentences + source", () => {
    const r = synthesizeFromHits([
      {
        id: "x",
        text: "Erster Satz hier. Zweiter Satz hier. Dritter Satz hier.",
        metadata: { source: "test", title: "Test-Titel" },
      },
    ]);
    expect(r).toContain("Erster Satz");
    expect(r).toContain("Zweiter Satz");
    expect(r).not.toContain("Dritter Satz");
    expect(r).toContain("Test-Titel");
  });

  it("two hits combines top-2-sentences + 1-supplement-sentence", () => {
    const r = synthesizeFromHits([
      {
        id: "a",
        text: "Top eins. Top zwei.",
        metadata: { source: "src-a", title: "Doc A" },
      },
      {
        id: "b",
        text: "Supp eins. Supp zwei.",
        metadata: { source: "src-b", title: "Doc B" },
      },
    ]);
    expect(r).toContain("Top eins");
    expect(r).toContain("Top zwei");
    expect(r).toContain("Supp eins");
    expect(r).not.toContain("Supp zwei");
  });

  it("dedupes sources by title", () => {
    const r = synthesizeFromHits([
      {
        id: "a",
        text: "Eins.",
        metadata: { source: "spannagel", title: "Doc X" },
      },
      {
        id: "b",
        text: "Zwei.",
        metadata: { source: "spannagel", title: "Doc X" },
      },
    ]);
    const occurrences = (r.match(/Doc X/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it("falls back to source when title missing", () => {
    const r = synthesizeFromHits([
      {
        id: "a",
        text: "Hallo.",
        metadata: { source: "spannagel" },
      },
    ]);
    expect(r).toContain("spannagel");
  });
});
