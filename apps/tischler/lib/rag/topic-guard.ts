import type {
  IRAGProvider,
  ITopicGuard,
  TopicVerdict,
} from "@craft-codex/core";

/**
 * Keyword-/Score-basierter Topic-Guard (Plan Sektion 8).
 *
 * Layer 1: Embedding-Score (per RAG-Top-Hit-Score approximiert).
 * Layer 2: Keyword-Blacklist — normalisiert (Leerzeichen/Trenner gestrippt),
 *          fängt also auch "bit coin" / "b-i-t-c-o-i-n".
 * Layer 3 (LLM-Classifier) ist optional und hier bewusst nicht aktiv.
 *
 * Schwellen anpassbar im Constructor.
 */
export interface TopicGuardConfig {
  rag: IRAGProvider;
  onTopicMin?: number;
  offTopicMax?: number;
  blacklist?: string[];
}

export class KeywordTopicGuard implements ITopicGuard {
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
    // Normalisiert (nur a-z0-9) → "bit coin"/"b-i-t-c-o-i-n" greifen ebenfalls.
    const norm = lower.replace(/[^a-z0-9]+/g, "");
    const blackHit = this.blacklist.find(
      (kw) => lower.includes(kw) || norm.includes(kw.replace(/[^a-z0-9]+/g, "")),
    );
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
