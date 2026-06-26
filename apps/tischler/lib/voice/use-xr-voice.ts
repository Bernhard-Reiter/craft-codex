"use client";

import { useMemo, useRef, useState } from "react";
import type {
  IRAGProvider,
  ITopicGuard,
  ITTSProvider,
  TTSChunk,
  VoicePipelineState,
} from "@craft-codex/core";
import { VoicePipeline, type AnswerFn } from "./pipeline";
import { mockSttFromText } from "./mock-stt";
import { MockTTSProvider } from "./mock-tts";
import { createDovetailAnswerFn } from "./dovetail-answer";
import { playPcmChunks } from "./pcm-player";

export interface XRVoiceState {
  status: VoicePipelineState["status"];
  /** Letzte Antwort als Text (immer da — auch wenn kein Audio spielt). */
  response: string;
  /** true = Audio lief, false = nur Text (Cache/Server leer), null = noch nichts. */
  audioPlayed: boolean | null;
  ask: (question: string) => void;
}

/**
 * Schlanke Voice-Frage-Schleife fuer die XR-Session (World-Space, kein DOM).
 *
 * Demo-sicher nach Brainstorm-Konsens:
 * - **Lokales RAG-Template als primaere Antwort** (offline-faehig, keine
 *   Netz-/Key-Abhaengigkeit) — der Server-`answer` ist hier bewusst NICHT der
 *   Hauptpfad, weil Schul-WLAN/Werkstattlaerm das Demo-Risiko #1 sind.
 * - **TTS optional**: liegt eine echte Stimme (Cache/Server) an, spricht sie;
 *   sonst bleibt der Text sichtbar und die Demo laeuft weiter.
 * - Status haengt nie: bei einem Pipeline-Fehler faellt der Status auf idle.
 */
export function useXRVoice({
  rag,
  guard,
  tts,
}: {
  rag: IRAGProvider;
  guard: ITopicGuard;
  tts?: ITTSProvider;
}): XRVoiceState {
  const [status, setStatus] = useState<VoicePipelineState["status"]>("idle");
  const [response, setResponse] = useState("");
  const [audioPlayed, setAudioPlayed] = useState<boolean | null>(null);
  const busyRef = useRef(false);

  const localAnswer = useMemo(
    () => createDovetailAnswerFn({ rag, guard }),
    [rag, guard],
  );

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || busyRef.current) return;
    busyRef.current = true;
    setAudioPlayed(null);

    const ttsProvider = tts ?? new MockTTSProvider({ secondsPerChar: 0.04 });

    const run = async (answerFn: AnswerFn): Promise<TTSChunk[]> => {
      const pipeline = new VoicePipeline({
        stt: mockSttFromText(q),
        tts: ttsProvider,
        answer: answerFn,
      });
      const unsub = pipeline.onStateChange((s) => {
        setStatus(s.status);
        if (s.currentResponse) setResponse(s.currentResponse);
      });
      try {
        const audioStream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array([0]));
            controller.close();
          },
        });
        const chunks: TTSChunk[] = [];
        for await (const chunk of pipeline.handle(audioStream)) {
          chunks.push(chunk);
        }
        return chunks;
      } finally {
        unsub();
      }
    };

    void (async () => {
      try {
        const chunks = await run(localAnswer);
        const played = await playPcmChunks(chunks);
        setAudioPlayed(played);
      } catch {
        setAudioPlayed(false);
      } finally {
        busyRef.current = false;
        setStatus("idle");
      }
    })();
  };

  return { status, response, audioPlayed, ask };
}
