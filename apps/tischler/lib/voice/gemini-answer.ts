/**
 * Gemini AnswerFn — the dialog brain with conversation memory (Phase E.2).
 *
 * Same contract as createClaudeAnswerFn / createDovetailAnswerFn, plus a
 * `history` of previous turns so FOLLOW-UP questions work ("und bei Eiche?").
 * Stateless by design: the caller (console client-side, answer route
 * server-side) passes the recent turns with every request — no session store.
 *
 * Runs on the same GEMINI_API_KEY as the demo voice (one vendor, zero new
 * accounts — Bernhard's bake-off call 2026-06-10).
 */

import type { IRAGProvider, ITopicGuard } from "@craft-codex/core";
import {
  DEFAULT_VOICE_LOCALE,
  getOffTopicReply,
  getTemplateAnswerStrings,
  getVoiceSystemPrompt,
  type VoiceLocale,
} from "./voice-locale";

type FetchLike = typeof globalThis.fetch;

export interface DialogTurn {
  question: string;
  answer: string;
}

export interface GeminiAnswerConfig {
  apiKey: string;
  /** Default: gemini-2.5-flash (stable — demo first). Override e.g. gemini-3-flash-preview. */
  model?: string;
  endpoint?: string;
  systemPrompt?: string;
  rag?: IRAGProvider;
  guard?: ITopicGuard;
  /** Previous turns, oldest first. Only the last MAX_TURNS are sent. */
  history?: ReadonlyArray<DialogTurn>;
  maxOutputTokens?: number;
  fetchImpl?: FetchLike;
  /** Antwortsprache (System-Prompt + Off-Topic-Reply). Default: "de" */
  locale?: VoiceLocale;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com";
const MAX_TURNS = 4;

/**
 * Follow-ups are often too short for the topic guard ("und bei Eiche?" has
 * zero corpus overlap). Evaluate with the previous question prepended so the
 * guard sees the actual conversational topic.
 */
export function guardQuery(query: string, history: ReadonlyArray<DialogTurn>): string {
  const last = history[history.length - 1];
  if (!last) return query;
  if (query.trim().length >= 40) return query;
  return `${last.question} ${query}`;
}

export function createGeminiAnswerFn(config: GeminiAnswerConfig) {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    endpoint = DEFAULT_ENDPOINT,
    locale = DEFAULT_VOICE_LOCALE,
    systemPrompt = getVoiceSystemPrompt(locale),
    rag,
    guard,
    history = [],
    maxOutputTokens = 512,
    fetchImpl,
  } = config;
  const offTopicReply = getOffTopicReply(locale);

  // Gemini 2.5 ist ein Thinking-Modell: ohne Deckel verbrauchen die
  // Denk-Tokens das maxOutputTokens-Budget und die sichtbare Antwort bricht
  // mitten im Satz ab (oder kommt komplett leer → "empty response").
  // Fuer 3-Satz-Werkstatt-Antworten ist Thinking unnoetig: aus. Bonus:
  // spuerbar niedrigere Latenz. Nur fuer 2.5-Modelle setzen — andere
  // Modellfamilien lehnen thinkingBudget als INVALID_ARGUMENT ab.
  const generationConfig: {
    maxOutputTokens: number;
    thinkingConfig?: { thinkingBudget: number };
  } = { maxOutputTokens };
  if (model.startsWith("gemini-2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  return async function* answer(query: string): AsyncIterable<string> {
    if (!apiKey) throw new Error("GEMINI_API_KEY missing — provide via GeminiAnswerConfig.apiKey");
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      yield getTemplateAnswerStrings(locale).emptyQuery;
      return;
    }

    const recent = history.slice(-MAX_TURNS);

    if (guard) {
      const v = await guard.evaluate(guardQuery(trimmed, recent));
      if (v.decision === "off") {
        yield offTopicReply;
        return;
      }
    }

    // RAG over the question PLUS conversational context — follow-ups alone
    // ("warum?") retrieve nothing useful.
    let context = "";
    if (rag) {
      const hits = await rag.query(guardQuery(trimmed, recent), { topK: 4, minScore: 0.1 });
      if (hits.length > 0) {
        context = hits
          .map((h, i) => `[${i + 1}] ${h.metadata.title ?? h.metadata.source ?? h.id}: ${h.text}`)
          .join("\n\n");
      }
    }

    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    for (const turn of recent) {
      contents.push({ role: "user", parts: [{ text: turn.question }] });
      contents.push({ role: "model", parts: [{ text: turn.answer }] });
    }
    contents.push({
      role: "user",
      parts: [
        {
          text: context
            ? `${trimmed}\n\nKontext aus dem Wissenskorpus:\n${context}`
            : trimmed,
        },
      ],
    });

    const f = fetchImpl ?? globalThis.fetch;
    const res = await f(`${endpoint}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig,
      }),
    });
    if (!res.ok) {
      throw new Error(`GeminiAnswer HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("GeminiAnswer: empty response");
    yield text;
  };
}
