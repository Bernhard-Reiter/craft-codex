import { describe, it, expect } from "vitest";
import { LocalRAGProvider } from "./local-rag";
import { StubTopicGuard } from "./topic-guard";

const SAMPLE_DOCS = [
  {
    id: "spannagel-1",
    text: "Schwalbenschwanz Zinken werden mit Streichmass und Schmiege angerissen. Anrisslinie umlaufend.",
    metadata: { source: "spannagel", title: "Moebelbau" },
  },
  {
    id: "klausz-1",
    text: "Frank Klausz saegt die Pins zuerst — auf der Abfallseite der Anrisslinie. Schwalbenwinkel 1:6 fuer Hartholz.",
    metadata: { source: "klausz", title: "Dovetails by Hand" },
  },
  {
    id: "pollak-1",
    text: "Stemmeisen-Schliff: 25 Grad fuer Weichholz, 30 Grad fuer Hartholz. Stosseisen breiter als der Pin.",
    metadata: { source: "pollak", title: "Holzverbindungen" },
  },
];

describe("LocalRAGProvider", () => {
  it("empty docs return empty result", async () => {
    const r = new LocalRAGProvider();
    expect(await r.query("Schwalbenschwanz")).toEqual([]);
  });

  it("query returns top hits sorted by score", async () => {
    const r = new LocalRAGProvider(SAMPLE_DOCS);
    const hits = await r.query("Anrisslinie Streichmass");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toBe("spannagel-1");
    if (hits.length > 1) {
      expect(hits[0]!.score! >= hits[1]!.score!).toBe(true);
    }
  });

  it("topK respects limit", async () => {
    const r = new LocalRAGProvider(SAMPLE_DOCS);
    const hits = await r.query("Pin Anrisslinie Stemmeisen", { topK: 2 });
    expect(hits.length).toBeLessThanOrEqual(2);
  });

  it("minScore filters low-relevance hits", async () => {
    const r = new LocalRAGProvider(SAMPLE_DOCS);
    const hits = await r.query("Quantenphysik Photonen", { minScore: 0.1 });
    expect(hits).toEqual([]);
  });

  it("addDocument adds incrementally", async () => {
    const r = new LocalRAGProvider();
    r.addDocument(SAMPLE_DOCS[0]!);
    const hits = await r.query("Anrisslinie");
    expect(hits.length).toBe(1);
  });

  it("health reports doc count", async () => {
    const r = new LocalRAGProvider(SAMPLE_DOCS);
    const h = await r.health();
    expect(h.ok).toBe(true);
    expect(h.reason).toContain("3");
  });

  it("query with empty string returns empty", async () => {
    const r = new LocalRAGProvider(SAMPLE_DOCS);
    expect(await r.query("")).toEqual([]);
  });
});

describe("StubTopicGuard", () => {
  const rag = new LocalRAGProvider(SAMPLE_DOCS);

  it("on-topic when RAG-score is high", async () => {
    const g = new StubTopicGuard({ rag, onTopicMin: 0.3 });
    const v = await g.evaluate("Anrisslinie Streichmass Schwalbenschwanz");
    expect(v.decision).toBe("on");
    if (v.decision === "on") expect(v.layer).toBe("embedding");
  });

  it("off-topic via blacklist", async () => {
    const g = new StubTopicGuard({
      rag,
      blacklist: ["bitcoin", "krypto"],
    });
    const v = await g.evaluate("Wo kann ich Bitcoin kaufen");
    expect(v.decision).toBe("off");
    if (v.decision === "off") expect(v.layer).toBe("keyword");
  });

  it("off-topic when RAG-score low", async () => {
    const g = new StubTopicGuard({ rag, offTopicMax: 0.5 });
    const v = await g.evaluate("Gartenarbeit Tomaten Duenger");
    expect(v.decision).toBe("off");
  });

  it("redirect for borderline-cases", async () => {
    const g = new StubTopicGuard({
      rag,
      onTopicMin: 0.9,
      offTopicMax: 0.05,
    });
    // 1 of 2 query-tokens matches → score 0.5 → zwischen 0.05 und 0.9
    const v = await g.evaluate("Schraubzwinge Schwalbenschwanz");
    expect(v.decision).toBe("redirect");
    if (v.decision === "redirect") expect(v.bridge).toMatch(/Aufgabe/i);
  });
});

// ── E.2 Upgrades (2026-06-11): Synonyme, IDF, Längen-Dämpfung ──────────────

import { getDemoCorpus } from "./corpus";

describe("LocalRAG E.2 — Tischler-Synonyme + IDF (Skala bleibt 0..1)", () => {
  it("'Zinken' findet Schwalbenschwanz-Wissen (Synonym-Normalisierung)", async () => {
    const rag = new LocalRAGProvider(getDemoCorpus());
    const hits = await rag.query("Wie mache ich saubere Zinken", { topK: 3, minScore: 0.05 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /schwalben/i.test(h.text) || /schwalben/i.test(String(h.metadata.title ?? "")))).toBe(true);
  });

  it("'LAP' findet die Lehrabschlussprüfung in der Ausbildungsordnung", async () => {
    const rag = new LocalRAGProvider(getDemoCorpus());
    const hits = await rag.query("Was kommt bei der LAP", { topK: 4, minScore: 0.05 });
    expect(hits.some((h) => /lehrabschlusspr/i.test(h.text))).toBe(true);
  });

  it("alle Scores bleiben in 0..1 (Guard-Schwellen-Kompatibilität)", async () => {
    const rag = new LocalRAGProvider(getDemoCorpus());
    const hits = await rag.query("Schwalbenwinkel Hartholz Stemmeisen Anriss", { topK: 10, minScore: 0 });
    for (const h of hits) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(1);
    }
  });

  it("seltene Fachwörter wiegen mehr als Allerweltswörter (IDF)", async () => {
    const rag = new LocalRAGProvider([
      { id: "common", text: "holz holz brett werkstatt arbeit", metadata: {} },
      { id: "rare", text: "schmiege einstellen winkel uebertragen holz", metadata: {} },
    ] as never);
    const hits = await rag.query("schmiege holz", { topK: 2, minScore: 0 });
    expect(hits[0]?.id).toBe("rare"); // trifft das seltene UND das häufige Wort
  });
});
