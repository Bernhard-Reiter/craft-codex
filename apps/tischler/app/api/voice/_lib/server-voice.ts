/**
 * Phase E — server-side voice core (shared by the /api/voice/* routes).
 *
 * API keys live ONLY here (process.env on the server). The browser talks to
 * these routes; the client falls back to cached TTS audio / template answers
 * when a route reports 503 (offline demo chain: server → cache → mock).
 *
 * Provider semantics deliberately mirror VOAI's `@voai/service-voice`
 * (STT: whisper · TTS: elevenlabs · answer/NLU: anthropic) so the open
 * engine and the proprietary VOAI stack stay conceptually interchangeable.
 */

import { LocalRAGProvider } from "../../../../lib/rag/local-rag";
import { StubTopicGuard } from "../../../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../../../lib/rag/corpus";
import { createDovetailAnswerFn } from "../../../../lib/voice/dovetail-answer";
import { createClaudeAnswerFn } from "../../../../lib/voice/claude-answer";
import { createGeminiAnswerFn, type DialogTurn } from "../../../../lib/voice/gemini-answer";
import type { AnswerFn } from "../../../../lib/voice/pipeline";

export type TTSProviderName = "gemini" | "elevenlabs" | null;

export interface ServerVoiceCapabilities {
  /** Whisper STT available (OPENAI_API_KEY set). */
  stt: boolean;
  /** Any TTS provider available. */
  tts: boolean;
  /** Which one the tts route will use (TTS_PROVIDER override, else auto). */
  ttsProvider: TTSProviderName;
  /** Which answer brain runs server-side. Template works without any key. */
  answer: AnswerProviderName;
}

/**
 * Provider pick: explicit TTS_PROVIDER env wins; otherwise gemini when the
 * (already existing) GEMINI_API_KEY is set, else elevenlabs. Bake-off
 * 2026-06-10: Bernhard chose Gemini for the Lienz demo voice.
 */
export function ttsProvider(): TTSProviderName {
  const forced = process.env.TTS_PROVIDER;
  if (forced === "gemini") return process.env.GEMINI_API_KEY ? "gemini" : null;
  if (forced === "elevenlabs") return process.env.ELEVENLABS_API_KEY ? "elevenlabs" : null;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return null;
}

export function capabilities(): ServerVoiceCapabilities {
  const tts = ttsProvider();
  return {
    stt: !!process.env.OPENAI_API_KEY,
    tts: tts !== null,
    ttsProvider: tts,
    answer: answerProvider(),
  };
}

// RAG corpus + guard are pure in-memory structures — build once per process.
let ragSingleton: { rag: LocalRAGProvider; guard: StubTopicGuard } | null = null;

export function serverRag() {
  if (!ragSingleton) {
    const rag = new LocalRAGProvider(getDemoCorpus());
    const guard = new StubTopicGuard({
      rag,
      onTopicMin: 0.25,
      offTopicMax: 0.05,
      blacklist: ["bitcoin", "krypto", "trading"],
    });
    ragSingleton = { rag, guard };
  }
  return ragSingleton;
}

export type AnswerProviderName = "gemini" | "claude" | "template";

/**
 * Dialog brain pick: ANSWER_PROVIDER env wins; else gemini (existing key,
 * conversation memory) > claude > template. Template ALWAYS works offline —
 * it just has no memory (follow-ups degrade to standalone questions).
 */
export function answerProvider(): AnswerProviderName {
  const forced = process.env.ANSWER_PROVIDER;
  if (forced === "gemini") return process.env.GEMINI_API_KEY ? "gemini" : "template";
  if (forced === "claude") return process.env.ANTHROPIC_API_KEY ? "claude" : "template";
  if (forced === "template") return "template";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "template";
}

export function serverAnswerFn(history: ReadonlyArray<DialogTurn> = []): {
  fn: AnswerFn;
  mode: AnswerProviderName;
} {
  const { rag, guard } = serverRag();
  switch (answerProvider()) {
    case "gemini":
      return {
        fn: createGeminiAnswerFn({
          apiKey: process.env.GEMINI_API_KEY ?? "",
          rag,
          guard,
          history,
          ...(process.env.GEMINI_ANSWER_MODEL ? { model: process.env.GEMINI_ANSWER_MODEL } : {}),
        }),
        mode: "gemini",
      };
    case "claude":
      return {
        fn: createClaudeAnswerFn({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", rag, guard }),
        mode: "claude",
      };
    default:
      return { fn: createDovetailAnswerFn({ rag, guard }), mode: "template" };
  }
}

/** AnswerFn may stream — collect to a single string for the JSON response. */
export async function collectAnswer(fn: AnswerFn, question: string): Promise<string> {
  const out = fn(question);
  if (typeof (out as Promise<string>).then === "function") {
    return await (out as Promise<string>);
  }
  let text = "";
  for await (const chunk of out as AsyncIterable<string>) text += chunk;
  return text;
}

export function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
