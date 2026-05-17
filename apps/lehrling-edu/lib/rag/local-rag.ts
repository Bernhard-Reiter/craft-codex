import type {
  IRAGProvider,
  RAGDocument,
  RAGQueryOptions,
} from "@voai/lehrlings-core";

/**
 * In-Memory RAG-Provider fuer Phase B/C MVP.
 *
 * Stub: tokenisiert Query + scored Dokumente per Bag-of-Words Overlap.
 * Phase C+ ersetzt das durch Qdrant + Embeddings (per Plan-Doc Sektion 8).
 */
export class LocalRAGProvider implements IRAGProvider {
  private docs: RAGDocument[];

  constructor(docs: RAGDocument[] = []) {
    this.docs = docs;
  }

  addDocument(doc: RAGDocument): void {
    this.docs.push(doc);
  }

  async query(
    query: string,
    options: RAGQueryOptions = {},
  ): Promise<RAGDocument[]> {
    const { topK = 5, minScore = 0.05 } = options;
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scored = this.docs.map((doc) => {
      const docTokens = tokenize(doc.text);
      const overlap = countOverlap(queryTokens, docTokens);
      const score = docTokens.length > 0 ? overlap / queryTokens.length : 0;
      return { doc, score };
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
      reason: `LocalRAGProvider stub — ${this.docs.length} docs in memory`,
    };
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function countOverlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((t) => setB.has(t)).length;
}
