import { describe, it, expect } from "vitest";
import { LocalRAGProvider } from "./local-rag";
import { getDemoCorpus } from "./corpus";

/**
 * Verifikation: Beantwortet die RAG die KONSTRUKTIONS-Rueckfragen, die der
 * Meister beim gefuehrten Anreissen bekommt? (dovetail-konstruktion-corpus)
 */
describe("Zinken-Konstruktion — Anreiss-Rueckfragen retrieval", () => {
  const rag = new LocalRAGProvider(getDemoCorpus());

  const cases: Array<{ q: string; accept: string[] }> = [
    {
      q: "Wie viele Schwalben passen auf das Brett, wie berechne ich die Anzahl?",
      accept: ["konstruktion-mittellinie", "konstruktion-warum-17", "konstruktion-grundsystem"],
    },
    {
      q: "Warum steht in der Schwalbenformel die Zahl 1,7?",
      accept: ["konstruktion-warum-17", "konstruktion-mittellinie"],
    },
    {
      q: "Was ist die Randzinkenverstaerkung RZV?",
      accept: ["konstruktion-randverstaerkung", "konstruktion-begriffe"],
    },
    {
      q: "Wie teile ich die Brettbreite in gleiche Teile ohne krumme Masse zu messen?",
      accept: ["konstruktion-hilfsstrahl", "konstruktion-grundlinie-ungerade"],
    },
    {
      q: "Darf man Laengsholz starr mit Querholz verleimen?",
      accept: ["konstruktion-schwindmass-regel"],
    },
  ];

  for (const { q, accept } of cases) {
    it(`"${q}" → liefert einen passenden Konstruktions-Treffer`, async () => {
      const hits = await rag.query(q, { topK: 4, minScore: 0.02 });
      const ids = hits.map((h) => h.id);
      // eslint-disable-next-line no-console
      console.log(`Q: ${q}\n   → ${ids.join(", ")}`);
      expect(ids.some((id) => accept.includes(id))).toBe(true);
    });
  }
});
