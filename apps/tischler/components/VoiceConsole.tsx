"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  IRAGProvider,
  ITopicGuard,
  ITTSProvider,
  ISTTProvider,
  TTSChunk,
  VoicePipelineState,
} from "@craft-codex/core";
import { VoicePipeline, type AnswerFn } from "../lib/voice/pipeline";
import { MockSTTProvider, mockSttFromText } from "../lib/voice/mock-stt";
import { MockTTSProvider } from "../lib/voice/mock-tts";
import { createDovetailAnswerFn } from "../lib/voice/dovetail-answer";
import { playPcmChunks } from "../lib/voice/pcm-player";
import type { VoiceMode } from "../lib/voice/factory";
import type { DialogTurn } from "../lib/voice/gemini-answer";

const MAX_DIALOG_TURNS = 6;

interface VoiceConsoleProps {
  rag: IRAGProvider;
  guard: ITopicGuard;
  /** Override fuer echten STT-Provider. Default: MockSTT (Fragen-Rotation). */
  stt?: ISTTProvider;
  /** Override fuer echten TTS-Provider. Default: MockTTS (silent PCM). */
  tts?: ITTSProvider;
  /**
   * Override fuer die Antwort-Quelle (Phase E: Server-Route). Wirft sie
   * (offline), faellt die Console automatisch auf das lokale RAG-Template
   * zurueck — die Demo verliert NIE die Antwort.
   */
  answer?: AnswerFn;
  /**
   * Dialog-Variante (Phase E.2): bekommt die bisherigen Gespraechsrunden und
   * liefert die AnswerFn fuer DIESE Frage — so funktionieren Rueckfragen
   * ("und bei Eiche?"). Hat Vorrang vor `answer`.
   */
  makeAnswer?: (history: ReadonlyArray<DialogTurn>) => AnswerFn;
  /** Demo-Fragen: erscheinen als Buttons UND rotieren am Mic-Button. */
  sampleQueries?: ReadonlyArray<string>;
  /** Mode-Badge. Auto-detect wenn nicht gesetzt. */
  mode?: VoiceMode;
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
  answer,
  makeAnswer,
  sampleQueries = DEFAULT_SAMPLE_QUERIES,
  mode,
}: VoiceConsoleProps) {
  const effectiveMode: VoiceMode =
    mode ?? (makeAnswer || answer ? "server" : stt && tts ? "real" : "mock");
  const queryIdxRef = useRef(0);
  const [state, setState] = useState<VoicePipelineState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [audioPlayed, setAudioPlayed] = useState<boolean | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [dialog, setDialog] = useState<DialogTurn[]>([]);

  const localAnswer = useMemo(
    () => createDovetailAnswerFn({ rag, guard }),
    [rag, guard],
  );

  // Eine Frage end-to-end: Text → answer → TTS → Lautsprecher.
  // STT wird mit dem Fragetext kurzgeschlossen (mockSttFromText) — derselbe
  // Pfad traegt Buttons, Texteingabe und Mic-Rotation.
  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || state.status !== "idle") return;
    setError(null);
    setAudioPlayed(null);
    setUsedFallback(false);

    const ttsProvider = tts ?? new MockTTSProvider({ secondsPerChar: 0.04 });

    const runOnce = async (
      answerFn: AnswerFn,
    ): Promise<{ chunks: TTSChunk[]; responseText: string }> => {
      const pipeline = new VoicePipeline({
        stt: mockSttFromText(q),
        tts: ttsProvider,
        answer: answerFn,
      });
      const unsub = pipeline.onStateChange((s) => setState(s));
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
        return { chunks, responseText: pipeline.getState().currentResponse ?? "" };
      } finally {
        unsub();
      }
    };

    const primary = makeAnswer ? makeAnswer(dialog) : answer;

    try {
      let result: { chunks: TTSChunk[]; responseText: string };
      try {
        result = await runOnce(primary ?? localAnswer);
      } catch (primaryErr) {
        if (!primary) throw primaryErr;
        // Server nicht erreichbar (offline?) → lokales RAG-Template (ohne Gedaechtnis).
        setUsedFallback(true);
        result = await runOnce(localAnswer);
      }
      if (result.responseText) {
        setDialog((d) =>
          [...d, { question: q, answer: result.responseText }].slice(-MAX_DIALOG_TURNS),
        );
      }
      const played = await playPcmChunks(result.chunks);
      setAudioPlayed(played);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline-Fehler");
    }
  };

  const handleMicClick = () => {
    const idx = queryIdxRef.current % sampleQueries.length;
    queryIdxRef.current += 1;
    void ask(sampleQueries[idx] ?? "Frage");
  };

  const handleTypedSubmit = () => {
    const q = typed;
    setTyped("");
    void ask(q);
  };

  useEffect(() => {
    // initial render only — keep ESLint quiet about the ref-based rotation.
  }, []);

  const busy = state.status !== "idle";
  const statusColor =
    state.status === "idle"
      ? "var(--color-muted)"
      : state.status === "speaking"
        ? "var(--color-accent)"
        : "var(--color-accent-warm)";

  const badge = badgeFor(effectiveMode);

  return (
    <div
      data-testid="voice-console"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
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
          disabled={busy}
          style={{
            padding: "0.55rem 1rem",
            background: !busy ? "var(--color-accent)" : "transparent",
            color: !busy ? "#0b0d10" : "var(--color-muted)",
            border: `1px solid ${!busy ? "var(--color-accent)" : "var(--color-border)"}`,
            borderRadius: 6,
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: !busy ? "pointer" : "not-allowed",
          }}
        >
          🎤 {!busy ? "Frage stellen" : labelFor(state.status)}
        </button>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            padding: "0.15rem 0.4rem",
            borderRadius: 4,
            background: badge.bg,
            color: badge.fg,
            border: `1px solid ${badge.border}`,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
          aria-label={`Voice mode: ${effectiveMode}`}
        >
          {badge.label}
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

      {/* Demo-Fragen — der kontrollierte Pfad fuer die Vorfuehrung. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {sampleQueries.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void ask(q)}
            disabled={busy}
            style={{
              fontSize: "0.72rem",
              padding: "0.3rem 0.55rem",
              background: "transparent",
              color: busy ? "var(--color-muted)" : "var(--color-fg)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Texteingabe — das Offline-Mikrofon: Tippen geht immer. */}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTypedSubmit();
          }}
          placeholder="… oder Frage tippen (geht auch offline)"
          disabled={busy}
          aria-label="Frage eingeben"
          style={{
            flex: 1,
            padding: "0.45rem 0.6rem",
            background: "var(--color-bg)",
            color: "var(--color-fg)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: "0.85rem",
          }}
        />
        <button
          type="button"
          onClick={handleTypedSubmit}
          disabled={busy || typed.trim().length === 0}
          style={{
            padding: "0.45rem 0.8rem",
            background: "transparent",
            color: "var(--color-fg)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: "0.85rem",
            cursor: busy || typed.trim().length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Fragen
        </button>
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
        <div style={{ fontSize: "0.85rem", color: "var(--color-fg)", lineHeight: 1.5 }}>
          <strong>A:</strong> {state.currentResponse}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        {state.latencyMs &&
          (state.latencyMs.stt !== undefined ||
            state.latencyMs.llm !== undefined ||
            state.latencyMs.tts !== undefined) && (
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--color-muted)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              stt:{state.latencyMs.stt ?? "—"}ms · llm:{state.latencyMs.llm ?? "—"}ms ·
              tts:{state.latencyMs.tts ?? "—"}ms
            </span>
          )}
        {audioPlayed === true && (
          <span style={{ fontSize: "0.7rem", color: "#22C55E" }}>🔊 Audio abgespielt</span>
        )}
        {audioPlayed === false && state.currentResponse && (
          <span style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>
            🔇 kein Audio (Cache/Server leer — Text-Antwort)
          </span>
        )}
        {usedFallback && (
          <span style={{ fontSize: "0.7rem", color: "var(--color-accent-warm)" }}>
            offline-Fallback: lokales Wissen
          </span>
        )}
        {dialog.length > 0 && (
          <>
            <span style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>
              💬 Gespraech: {dialog.length} Frage{dialog.length === 1 ? "" : "n"}
            </span>
            <button
              type="button"
              onClick={() => setDialog([])}
              disabled={busy}
              style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.5rem",
                background: "transparent",
                color: "var(--color-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: 999,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              neues Gespraech
            </button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
          {error}
        </div>
      )}
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

function badgeFor(mode: VoiceMode): { label: string; bg: string; fg: string; border: string } {
  switch (mode) {
    case "server":
      return {
        label: "Server",
        bg: "rgba(96, 165, 250, 0.15)",
        fg: "#60A5FA",
        border: "rgba(96, 165, 250, 0.5)",
      };
    case "real":
      return {
        label: "Live",
        bg: "rgba(34, 197, 94, 0.15)",
        fg: "#22C55E",
        border: "rgba(34, 197, 94, 0.5)",
      };
    default:
      return {
        label: "Mock",
        bg: "rgba(255, 184, 74, 0.15)",
        fg: "var(--color-accent-warm)",
        border: "rgba(255, 184, 74, 0.5)",
      };
  }
}

export { MockSTTProvider };
