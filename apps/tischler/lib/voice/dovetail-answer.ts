import type {
  IRAGProvider,
  ITopicGuard,
  RAGDocument,
} from "@craft-codex/core";
import {
  DEFAULT_VOICE_LOCALE,
  getTemplateAnswerStrings,
  type VoiceLocale,
} from "./voice-locale";

/**
 * Antwort-Synthesizer fuer Schwalbenschwanz-Voice-Pipeline.
 *
 * Phase C MVP: template-basiert, Top-Hits aus dem RAG-Korpus zusammensetzen.
 * Phase D: ersetzt durch Claude-Sonnet streaming SSE mit RAG-Context.
 *
 * Ablauf:
 *   1. TopicGuard.evaluate(query) → "off" | "on" | "redirect"
 *   2. Bei "off" → freundliche Off-Topic-Antwort
 *   3. Bei "redirect" → kurze On-Topic-Antwort + Bridge zur Aufgabe
 *   4. Bei "on" → Top-3 RAG-Hits → Template-Antwort mit Quellen
 */
export interface DovetailAnswerConfig {
  rag: IRAGProvider;
  guard: ITopicGuard;
  topK?: number;
  minScore?: number;
  /** Antwortsprache der Template-Strings. Default: "de" */
  locale?: VoiceLocale;
}

export function createDovetailAnswerFn(config: DovetailAnswerConfig) {
  const { rag, guard, topK = 3, minScore = 0.1, locale = DEFAULT_VOICE_LOCALE } = config;
  const strings = getTemplateAnswerStrings(locale);

  return async function answer(query: string): Promise<string> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return strings.emptyQuery;
    }

    const verdict = await guard.evaluate(trimmed);

    if (verdict.decision === "off") {
      const reason = "reason" in verdict ? verdict.reason : "";
      return reason
        ? `${strings.offTopic} (${reason})`
        : strings.offTopic;
    }

    const hits = await rag.query(trimmed, { topK, minScore });

    if (hits.length === 0) {
      return strings.noHits;
    }

    const body = synthesizeFromHits(hits, strings.sourcePrefix);

    if (verdict.decision === "redirect") {
      const bridge = "bridge" in verdict ? verdict.bridge : null;
      return bridge ? `${body}\n\n${bridge}` : body;
    }

    return body;
  };
}

/**
 * Bauen der Antwort: erste 1-2 Sätze des Top-Hits + ggf. Anker-Verweis auf
 * den zweiten Hit. Quellen-Liste am Ende fuer Lehrling-Transparenz.
 */
export function synthesizeFromHits(hits: RAGDocument[], sourcePrefix = "Quelle:"): string {
  if (hits.length === 0) return "";
  const top = hits[0]!;
  const main = firstSentences(top.text, 2);

  const supplement =
    hits.length >= 2 ? firstSentences(hits[1]!.text, 1) : null;

  const sources = uniqueSources(hits);
  const sourcesLine =
    sources.length > 0 ? `${sourcePrefix} ${sources.join(", ")}.` : "";

  const lines = [main];
  if (supplement) lines.push(supplement);
  if (sourcesLine) lines.push(sourcesLine);
  return lines.join(" ");
}

function firstSentences(text: string, count: number): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, count).join(" ");
}

function uniqueSources(hits: RAGDocument[]): string[] {
  const titles: string[] = [];
  for (const h of hits) {
    const t =
      typeof h.metadata.title === "string" && h.metadata.title.length > 0
        ? h.metadata.title
        : typeof h.metadata.source === "string"
          ? h.metadata.source
          : null;
    if (t && !titles.includes(t)) titles.push(t);
  }
  return titles;
}
