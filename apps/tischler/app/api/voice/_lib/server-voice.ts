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
import { getDovetailCorpus } from "../../../../lib/rag/corpus/dovetail-corpus";
import { createDovetailAnswerFn } from "../../../../lib/voice/dovetail-answer";
import { createClaudeAnswerFn } from "../../../../lib/voice/claude-answer";
import type { AnswerFn } from "../../../../lib/voice/pipeline";

export interface ServerVoiceCapabilities {
  /** Whisper STT available (OPENAI_API_KEY set). */
  stt: boolean;
  /** ElevenLabs TTS available (ELEVENLABS_API_KEY set). */
  tts: boolean;
  /** Which answer brain runs server-side. Template works without any key. */
  answer: "claude" | "template";
}

export function capabilities(): ServerVoiceCapabilities {
  return {
    stt: !!process.env.OPENAI_API_KEY,
    tts: !!process.env.ELEVENLABS_API_KEY,
    answer: process.env.ANTHROPIC_API_KEY ? "claude" : "template",
  };
}

// RAG corpus + guard are pure in-memory structures — build once per process.
let ragSingleton: { rag: LocalRAGProvider; guard: StubTopicGuard } | null = null;

export function serverRag() {
  if (!ragSingleton) {
    const rag = new LocalRAGProvider(getDovetailCorpus());
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

export function serverAnswerFn(): { fn: AnswerFn; mode: "claude" | "template" } {
  const { rag, guard } = serverRag();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      fn: createClaudeAnswerFn({ apiKey: anthropicKey, rag, guard }),
      mode: "claude",
    };
  }
  return { fn: createDovetailAnswerFn({ rag, guard }), mode: "template" };
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
