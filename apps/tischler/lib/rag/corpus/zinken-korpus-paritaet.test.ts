import { describe, it, expect } from "vitest";
import type { RAGDocument } from "@craft-codex/core";
import { getZinkenGrundlagenCorpus } from "./zinken-grundlagen-corpus";
import { getZinkenGrundlagenCorpusEn } from "./zinken-grundlagen-corpus.en";
import { getZinkenKonstruktionCorpus } from "./dovetail-konstruktion-corpus";
import { getZinkenKonstruktionCorpusEn } from "./dovetail-konstruktion-corpus.en";
import { getDovetailCorpus } from "./dovetail-corpus";
import { getDovetailCorpusEn } from "./dovetail-corpus.en";
import { getZinkenLehrgangCorpus } from "./zinken-lehrgang-corpus";
import { getDemoCorpus } from "./index";

/**
 * id-Parität DE/EN für ALLE Zinken-Korpora (bisher gab es keinen solchen
 * Test). Keine Ausnahmen: fehlt ein Gegenstück, ist das ein Befund.
 */
const PAARE: Array<[string, () => RAGDocument[], () => RAGDocument[]]> = [
  ["grundlagen", getZinkenGrundlagenCorpus, getZinkenGrundlagenCorpusEn],
  ["konstruktion", getZinkenKonstruktionCorpus, getZinkenKonstruktionCorpusEn],
  ["handwerk", getDovetailCorpus, getDovetailCorpusEn],
  ["lehrgang", () => getZinkenLehrgangCorpus("de"), () => getZinkenLehrgangCorpus("en")],
];

describe.each(PAARE)("Korpus %s — Parität DE/EN", (_name, de, en) => {
  it("gleiche ids in gleicher Reihenfolge", () => {
    expect(en().map((d) => d.id)).toEqual(de().map((d) => d.id));
  });
  it("gleiches Thema je id", () => {
    const enTopic = new Map(en().map((d) => [d.id, d.metadata.topic]));
    for (const d of de()) expect(enTopic.get(d.id), d.id).toBe(d.metadata.topic);
  });
  it("ids innerhalb des Korpus eindeutig", () => {
    const ids = de().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("kein leerer Text", () => {
    for (const d of [...de(), ...en()]) expect(d.text.trim().length, d.id).toBeGreaterThan(20);
  });
});

describe("Gesamtkorpus", () => {
  it.each(["de", "en"] as const)("%s: keine doppelten ids über alle Schichten", (loc) => {
    const ids = getDemoCorpus(loc).map((d) => d.id);
    const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(doppelt).toEqual([]);
  });
  it("Lehrgang steckt im Demo-Korpus (DE und EN)", () => {
    expect(getDemoCorpus("de").some((d) => d.id === "lehrgang-saegen-arbeitsschritt")).toBe(true);
    expect(getDemoCorpus("en").some((d) => d.id === "lehrgang-saegen-arbeitsschritt")).toBe(true);
  });
});
