"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  IRAGProvider,
  ITopicGuard,
  ITTSProvider,
  ISTTProvider,
  VoicePipelineState,
} from "@voai/lehrlings-core";
import { VoicePipeline } from "../lib/voice/pipeline";
import { MockSTTProvider, mockSttFromText } from "../lib/voice/mock-stt";
import { MockTTSProvider } from "../lib/voice/mock-tts";
import { createDovetailAnswerFn } from "../lib/voice/dovetail-answer";

interface VoiceConsoleProps {
  rag: IRAGProvider;
  guard: ITopicGuard;
  /**
   * Override fuer echten STT-Provider (Phase D: Whisper). Default: MockSTT
   * mit fixed transcripts (rotation pro click).
   */
  stt?: ISTTProvider;
  /**
   * Override fuer echten TTS-Provider (Phase D: ElevenLabs). Default:
   * MockTTS (silent PCM frames).
   */
  tts?: ITTSProvider;
  /** Sample-Queries fuer den Mock-STT (rotieren bei jedem Mic-Click). */
  sampleQueries?: ReadonlyArray<string>;
  /**
   * Mode-Badge UI. "mock" zeigt orange-warning, "real" zeigt green-active.
   * Wenn nicht gesetzt: auto-detect via stt+tts (beide gesetzt = real).
   */
  mode?: "mock" | "real";
}

const DEFAULT_SAMPLE_QUERIES: ReadonlyArray<string> = [
  "Wie reisse ich mit dem Streichmass an",
  "Schwalbenwinkel fuer Hartholz",
  "Stemmeisen Schliff",
  "Auf welcher Seite saege ich",
  "Wie pruefe ich die Passung",
];

export function VoiceConsole({
  rag,
  guard,
  stt,
  tts,
  sampleQueries = DEFAULT_SAMPLE_QUERIES,
  mode,
}: VoiceConsoleProps) {
  const effectiveMode: "mock" | "real" = mode ?? (stt && tts ? "real" : "mock");
  const queryIdxRef = useRef(0);
  const [state, setState] = useState<VoicePipelineState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  const pipeline = useMemo(() => {
    const sttProvider = stt ?? mockSttFromText(sampleQueries[0] ?? "Frage");
    const ttsProvider = tts ?? new MockTTSProvider({ secondsPerChar: 0.04 });
    return new VoicePipeline({
      stt: sttProvider,
      tts: ttsProvider,
      answer: createDovetailAnswerFn({ rag, guard }),
    });
  }, [rag, guard, stt, tts, sampleQueries]);

  useEffect(() => {
    return pipeline.onStateChange((s) => setState(s));
  }, [pipeline]);

  const handleMicClick = async () => {
    if (state.status !== "idle") return;
    setError(null);
    try {
      // Rotate the mock STT through sample queries.
      const idx = queryIdxRef.current % sampleQueries.length;
      const transcript = sampleQueries[idx] ?? "Frage";
      queryIdxRef.current += 1;
      const liveStt = stt ?? mockSttFromText(transcript);
      const livePipeline = new VoicePipeline({
        stt: liveStt,
        tts: tts ?? new MockTTSProvider({ secondsPerChar: 0.04 }),
        answer: createDovetailAnswerFn({ rag, guard }),
      });
      const unsub = livePipeline.onStateChange((s) => setState(s));
      const audioStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([0]));
          controller.close();
        },
      });
      let audioChunks = 0;
      for await (const _chunk of livePipeline.handle(audioStream)) {
        void _chunk;
        audioChunks += 1;
      }
      void audioChunks;
      unsub();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline-Fehler");
    }
  };

  const statusColor =
    state.status === "idle"
      ? "var(--color-muted)"
      : state.status === "speaking"
        ? "var(--color-accent)"
        : "var(--color-accent-warm)";

  return (
    <div
      data-testid="voice-console"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.75rem",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={handleMicClick}
          disabled={state.status !== "idle"}
          style={{
            padding: "0.55rem 1rem",
            background:
              state.status === "idle" ? "var(--color-accent)" : "transparent",
            color: state.status === "idle" ? "#0b0d10" : "var(--color-muted)",
            border: `1px solid ${
              state.status === "idle"
                ? "var(--color-accent)"
                : "var(--color-border)"
            }`,
            borderRadius: 6,
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: state.status === "idle" ? "pointer" : "not-allowed",
          }}
        >
          🎤{" "}
          {state.status === "idle" ? "Frage stellen" : labelFor(state.status)}
        </button>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            padding: "0.15rem 0.4rem",
            borderRadius: 4,
            background:
              effectiveMode === "real"
                ? "rgba(34, 197, 94, 0.15)"
                : "rgba(255, 184, 74, 0.15)",
            color:
              effectiveMode === "real" ? "#22C55E" : "var(--color-accent-warm)",
            border: `1px solid ${
              effectiveMode === "real"
                ? "rgba(34, 197, 94, 0.5)"
                : "rgba(255, 184, 74, 0.5)"
            }`,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
          aria-label={`Voice mode: ${effectiveMode}`}
        >
          {effectiveMode === "real" ? "Live" : "Mock"}
        </span>
        <span
          style={{
            fontSize: "0.8rem",
            color: statusColor,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {state.status}
        </span>
      </div>

      {state.currentQuery && (
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--color-muted)",
            paddingTop: "0.25rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <strong>Q:</strong> {state.currentQuery}
        </div>
      )}

      {state.currentResponse && (
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--color-fg)",
            lineHeight: 1.5,
          }}
        >
          <strong>A:</strong> {state.currentResponse}
        </div>
      )}

      {state.latencyMs &&
        (state.latencyMs.stt !== undefined ||
          state.latencyMs.llm !== undefined ||
          state.latencyMs.tts !== undefined) && (
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--color-muted)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            stt:{state.latencyMs.stt ?? "—"}ms · llm:
            {state.latencyMs.llm ?? "—"}ms · tts:
            {state.latencyMs.tts ?? "—"}ms
          </div>
        )}

      {error && (
        <div
          role="alert"
          style={{
            fontSize: "0.8rem",
            color: "#ff6b6b",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--color-muted)",
          opacity: 0.7,
        }}
      >
        Phase C Stub: MockSTT rotiert {sampleQueries.length} Sample-Queries,
        MockTTS spielt Stille. Phase D ersetzt durch Whisper + Claude SSE +
        ElevenLabs.
      </div>
    </div>
  );
}

function labelFor(status: VoicePipelineState["status"]): string {
  switch (status) {
    case "listening":
      return "Hoere zu …";
    case "thinking":
      return "Denke nach …";
    case "speaking":
      return "Spricht …";
    default:
      return "";
  }
}

export { MockSTTProvider };
