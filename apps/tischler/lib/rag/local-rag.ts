import type {
  IRAGProvider,
  RAGDocument,
  RAGQueryOptions,
} from "@craft-codex/core";

/**
 * In-Memory RAG-Provider (Phase B → E.2 Ausbau 2026-06-11).
 *
 * Mit dem RIS-Korpus wuchs der Bestand 41 → 228 Dokumente; reines
 * Bag-of-Words-Overlap reichte nicht mehr (lange Verordnungs-Chunks
 * verdraengten praegnante Handwerks-Docs, "Zinken" fand "Schwalbenschwanz"
 * nicht). Drei gezielte Upgrades — die SCORE-SKALA BLEIBT 0..1, damit die
 * kalibrierten Schwellen (TopicGuard 0.25/0.05, answer minScore 0.1) gelten:
 *
 *  1. Synonym-Normalisierung (Tischler-Vokabular) auf Query UND Dokumenten
 *  2. IDF-Gewichtung: seltene Fachwoerter zaehlen mehr als Allerweltswoerter
 *  3. Sanfte Laengen-Daempfung (BM25-inspiriert, auf 0.65..1.15 gekappt)
 *
 * Tokens werden einmal im Konstruktor indexiert (nicht pro Query).
 * Echte Embeddings bleiben P2 (IRAGProvider-Interface ist austauschbar).
 */

// Tischler-Synonyme → Stammbegriff. Wirkt symmetrisch (Query + Doc).
const SYNONYMS: Record<string, string> = {
  zinken: "schwalbenschwanz",
  zinkenverbindung: "schwalbenschwanz",
  schwalbenschwanzverbindung: "schwalbenschwanz",
  schwalben: "schwalbenschwanz",
  anzeichnen: "anreissen",
  anriss: "anreissen",
  anrisslinie: "anreissen",
  beitel: "stemmeisen",
  stechbeitel: "stemmeisen",
  stecheisen: "stemmeisen",
  saegen: "saege",
  zusammenpassen: "passung",
  passen: "passung",
  einpassen: "passung",
  lap: "lehrabschlusspruefung",
  abschlusspruefung: "lehrabschlusspruefung",
  lehrabschluss: "lehrabschlusspruefung",
};

interface IndexedDoc {
  doc: RAGDocument;
  tokens: Set<string>;
  length: number;
}

export class LocalRAGProvider implements IRAGProvider {
  private docs: RAGDocument[] = [];
  private index: IndexedDoc[] = [];
  private idf = new Map<string, number>();
  private avgLength = 1;

  constructor(docs: RAGDocument[] = []) {
    for (const doc of docs) this.insert(doc);
    this.rebuildStats();
  }

  addDocument(doc: RAGDocument): void {
    this.insert(doc);
    this.rebuildStats();
  }

  private insert(doc: RAGDocument): void {
    this.docs.push(doc);
    const tokens = tokenize(doc.text);
    this.index.push({ doc, tokens: new Set(tokens), length: tokens.length });
  }

  private rebuildStats(): void {
    const n = this.index.length;
    if (n === 0) return;
    const df = new Map<string, number>();
    let totalLen = 0;
    for (const entry of this.index) {
      totalLen += entry.length;
      for (const t of entry.tokens) df.set(t, (df.get(t) ?? 0) + 1);
    }
    this.avgLength = totalLen / n || 1;
    this.idf.clear();
    for (const [t, count] of df) {
      this.idf.set(t, Math.log(1 + n / count));
    }
  }

  async query(
    query: string,
    options: RAGQueryOptions = {},
  ): Promise<RAGDocument[]> {
    const { topK = 5, minScore = 0.05 } = options;
    const queryTokens = [...new Set(tokenize(query))];
    if (queryTokens.length === 0) return [];

    // Unknown tokens get the maximum weight — a rare Fachwort the corpus
    // lacks should not dilute the score of the ones it has.
    const maxIdf = Math.log(1 + Math.max(1, this.index.length));
    const weight = (t: string) => (this.idf.get(t) ?? maxIdf) / maxIdf;

    const totalWeight = queryTokens.reduce((s, t) => s + weight(t), 0);
    if (totalWeight === 0) return [];

    const scored = this.index.map((entry) => {
      let hit = 0;
      for (const t of queryTokens) {
        if (entry.tokens.has(t)) hit += weight(t);
      }
      // Gentle length damping (BM25-inspired), clamped so the 0..1 scale and
      // the calibrated guard thresholds survive.
      const lengthNorm = clamp(
        1 / (0.6 + 0.4 * (entry.length / this.avgLength)),
        0.65,
        1.15,
      );
      const score = Math.min(1, (hit / totalWeight) * lengthNorm);
      return { doc: entry.doc, score };
    });

    return scored
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({ ...s.doc, score: s.score }));
  }

  async health(): Promise<{ ok: boolean; reason?: string }> {
    return {
      ok: true,
      reason: `LocalRAGProvider — ${this.docs.length} docs indexed (idf terms: ${this.idf.size})`,
    };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      // Umlaut-Transliteration: der Handwerks-Korpus schreibt "ue" (saege),
      // die RIS-Verordnungen echte Umlaute (Lehrabschlussprüfung) — ohne
      // Normalisierung matchen die beiden Welten einander nie.
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3)
      .map((t) => SYNONYMS[t] ?? t)
  );
}
