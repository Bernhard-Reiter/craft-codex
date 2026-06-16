import { describe, it, expect } from "vitest";
import { LocalRAGProvider } from "./local-rag";
import { getDemoCorpus } from "./corpus";

/**
 * Verifikation: Beantwortet die RAG die Laien-Einstiegsfragen, die der
 * neue zinken-grundlagen-corpus abdecken soll? (Phase F "von ganz vorne")
 */
describe("Zinken-Grundlagen — Laien-Einstiegsfragen retrieval", () => {
  const rag = new LocalRAGProvider(getDemoCorpus());

  // Pro Frage gilt sie als beantwortet, wenn EINER der sachlich richtigen
  // Grundlagen-Treffer in den Top-4 ist (mehrere Docs koennen korrekt sein).
  const cases: Array<{ q: string; accept: string[] }> = [
    { q: "Was ist ein Zinken?", accept: ["zinken-was-ist-das"] },
    { q: "Wofuer sind Zinken gut, was kann man damit machen?", accept: ["zinken-wofuer"] },
    { q: "Welche Zinkenarten gibt es?", accept: ["zinkenarten-ueberblick"] },
    {
      q: "Wie reisst man Zinken am Brett an?",
      accept: [
        "anreissen-was-ist-das",
        "anreissen-werkzeuge",
        "anreissen-reihenfolge",
        "anreissen-zinkenformel",
        "anriss-streichmass",
        "anreissen-streichmass-justierung",
      ],
    },
    {
      q: "Was ist der Unterschied zwischen Fingerzinken und Schwalbenschwanz?",
      accept: ["zinkenart-fingerzinken", "zinkenart-schwalbenschwanz", "zinken-warum-haelt-formschluss"],
    },
    { q: "Wann nimmt man eine halbverdeckte Zinkung fuer Schubladen?", accept: ["zinkenart-halbverdeckte-zinkung"] },
  ];

  for (const { q, accept } of cases) {
    it(`"${q}" → liefert einen passenden Grundlagen-Treffer`, async () => {
      const hits = await rag.query(q, { topK: 4, minScore: 0.02 });
      const ids = hits.map((h) => h.id);
      // eslint-disable-next-line no-console
      console.log(`Q: ${q}\n   → ${ids.join(", ")}`);
      expect(ids.some((id) => accept.includes(id))).toBe(true);
    });
  }
});
