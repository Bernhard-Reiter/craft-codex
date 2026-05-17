/**
 * RAG-Provider + Topic-Guard-Interfaces.
 *
 * Open-Core: implementations live in consumer apps. The Open-Source
 * MVP uses an in-memory bag-of-words index (LocalRAGProvider in
 * apps/dovetail). Enterprise variants can plug in their own
 * Embedding-Backend (e.g. Qdrant, pgvector) by implementing this
 * interface — the package itself stays framework-agnostic.
 */

export interface RAGDocument {
  id: string;
  text: string;
  metadata: {
    source: string;
    title?: string;
    page?: number;
    chunk?: number;
    [key: string]: unknown;
  };
  /** Score 0..1 nach Embedding-Similarity */
  score?: number;
}

export interface RAGQueryOptions {
  /** Max Anzahl Treffer */
  topK?: number;
  /** Min-Score-Threshold */
  minScore?: number;
  /** Tenant-Isolation für proprietary */
  tenantId?: string;
  /** Filter auf metadata.source o.ä. */
  filters?: Record<string, string | string[]>;
}

export interface IRAGProvider {
  query(query: string, options?: RAGQueryOptions): Promise<RAGDocument[]>;
  health(): Promise<{ ok: boolean; reason?: string }>;
}

/** Topic-Guard-Verdict (3-Layer-Strategie aus Plan-Doc Sektion 8) */
export type TopicVerdict =
  | { decision: "on"; layer: "embedding" | "keyword" | "classifier" }
  | {
      decision: "off";
      layer: "embedding" | "keyword" | "classifier";
      reason: string;
    }
  | { decision: "redirect"; layer: "classifier"; bridge: string };

export interface ITopicGuard {
  /** Klassifiziere Query: on-topic, off-topic oder redirect (Lehrling soft-redirect zur Aufgabe). */
  evaluate(query: string): Promise<TopicVerdict>;
}
