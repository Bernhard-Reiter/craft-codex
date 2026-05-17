import type { IRAGProvider, ITopicGuard } from "@voai/lehrlings-core";

/**
 * Claude SSE AnswerFn fuer VoicePipeline (Phase D).
 *
 * Streaming via Anthropic Messages API. Liefert AsyncIterable<string>,
 * tauschbar gegen createDovetailAnswerFn (Template-MVP).
 *
 * **Dormant ohne API-Key:** Constructor wirft NICHT — der erste handler
 * Call wirft erst wenn ANTHROPIC_API_KEY fehlt. Ermoeglicht SSR + Tests
 * ohne Konfiguration.
 */
export interface ClaudeAnswerConfig {
  apiKey: string;
  /** Default: "claude-sonnet-4-6" */
  model?: string;
  /** Default: anthropic.com Messages-Endpoint */
  endpoint?: string;
  /** System-Prompt fuer den Lehrling-Tutor */
  systemPrompt?: string;
  /** Optional: RAG fuer Context-Augmentation vor Claude-Call */
  rag?: IRAGProvider;
  /** Optional: TopicGuard fuer Off-Topic-Filter */
  guard?: ITopicGuard;
  /** Max-Tokens fuer die Antwort. Default: 400 */
  maxTokens?: number;
  /** Custom fetch (fuer Tests). Default: globalThis.fetch */
  fetchImpl?: typeof fetch;
}

const DEFAULT_SYSTEM_PROMPT = `Du bist ein erfahrener Tischler-Meister und unterrichtest einen Lehrling.

Erkläre Schwalbenschwanz-Verbindungen in einfachen, klaren Worten auf Deutsch (Du-Form, Werkstatt-Slang ok). Maximal 3 kurze Sätze pro Antwort. Bleibe IMMER beim Thema Holzhandwerk — wenn die Frage abweicht, fuehre sanft zurueck zur Aufgabe.

Wenn dir RAG-Context zur Verfuegung gestellt wird, nutze ihn als Faktenbasis. Erfinde nichts.`;

const DEFAULT_ENDPOINT = "https://api.anthropic.com/v1/messages";

const DEFAULT_OFF_TOPIC =
  "Das passt jetzt nicht zum Schwalbenschwanz. Bleib am Werkstueck — wenn du eine konkrete Frage zum aktuellen Schritt hast, helfe ich dir.";

export function createClaudeAnswerFn(config: ClaudeAnswerConfig) {
  const {
    apiKey,
    model = "claude-sonnet-4-6",
    endpoint = DEFAULT_ENDPOINT,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    rag,
    guard,
    maxTokens = 400,
    fetchImpl,
  } = config;

  return async function* answer(query: string): AsyncIterable<string> {
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY missing — provide via ClaudeAnswerConfig.apiKey",
      );
    }
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      yield "Ich habe nichts gehoert. Stell deine Frage noch einmal.";
      return;
    }

    if (guard) {
      const v = await guard.evaluate(trimmed);
      if (v.decision === "off") {
        yield DEFAULT_OFF_TOPIC;
        return;
      }
    }

    let context = "";
    if (rag) {
      const hits = await rag.query(trimmed, { topK: 3, minScore: 0.1 });
      if (hits.length > 0) {
        context = hits
          .map(
            (h, i) =>
              `[${i + 1}] ${h.metadata.title ?? h.metadata.source ?? h.id}: ${h.text}`,
          )
          .join("\n\n");
      }
    }

    const userContent = context
      ? `${trimmed}\n\nKontext aus dem Lehrling-Korpus:\n${context}`
      : trimmed;

    const f = fetchImpl ?? globalThis.fetch;
    const response = await f(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        stream: true,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Claude API ${response.status}: ${text}`);
    }
    if (!response.body) {
      throw new Error("Claude API response has no body");
    }

    yield* parseSSEStream(response.body);
  };
}

/**
 * Anthropic SSE Format:
 *   event: content_block_delta
 *   data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}
 *
 * Liefert nur die text-deltas. Andere Events (message_start, ping, etc.)
 * werden ignoriert.
 */
async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let lineEnd: number;
      while ((lineEnd = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);
        if (!line || !line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (json === "[DONE]") return;
        try {
          const event = JSON.parse(json) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta" &&
            typeof event.delta.text === "string"
          ) {
            yield event.delta.text;
          }
        } catch {
          // skip malformed event
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
