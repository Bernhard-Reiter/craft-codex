import type {
  IRAGProvider,
  ITopicGuard,
  TopicVerdict,
} from "@voai/lehrlings-core";

/**
 * Stub-Implementierung des 3-Layer Topic-Guards (Plan Sektion 8).
 *
 * Layer 1: Embedding-Score (hier per RAG-Top-Hit-Score approximiert).
 * Layer 2: Keyword-Blacklist (deterministisch).
 * Layer 3: LLM-Classifier (Phase C — hier nur Stub).
 *
 * Schwellen anpassbar im Constructor.
 */
export interface TopicGuardConfig {
  rag: IRAGProvider;
  onTopicMin?: number;
  offTopicMax?: number;
  blacklist?: string[];
}

export class StubTopicGuard implements ITopicGuard {
  private rag: IRAGProvider;
  private onTopicMin: number;
  private offTopicMax: number;
  private blacklist: string[];

  constructor(config: TopicGuardConfig) {
    this.rag = config.rag;
    this.onTopicMin = config.onTopicMin ?? 0.5;
    this.offTopicMax = config.offTopicMax ?? 0.15;
    this.blacklist = (config.blacklist ?? []).map((s) => s.toLowerCase());
  }

  async evaluate(query: string): Promise<TopicVerdict> {
    const lower = query.toLowerCase();
    const blackHit = this.blacklist.find((kw) => lower.includes(kw));
    if (blackHit) {
      return {
        decision: "off",
        layer: "keyword",
        reason: `blacklist match: "${blackHit}"`,
      };
    }

    const hits = await this.rag.query(query, { topK: 1 });
    const topScore = hits[0]?.score ?? 0;

    if (topScore >= this.onTopicMin) {
      return { decision: "on", layer: "embedding" };
    }
    if (topScore <= this.offTopicMax) {
      return {
        decision: "off",
        layer: "embedding",
        reason: `score ${topScore.toFixed(2)} below off-topic threshold`,
      };
    }

    return {
      decision: "redirect",
      layer: "classifier",
      bridge: "Kurz dazu — aber zurueck zur eigentlichen Aufgabe.",
    };
  }
}
