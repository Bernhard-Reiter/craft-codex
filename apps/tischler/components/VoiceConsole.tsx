"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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

interface RAGCitation {
  label: string;
  license?: string;
  url?: string;
}

/** Lizenz → Message-Key des vertrauensbildenden Labels für den Citation-Badge. */
function trustLabelKey(license?: string): "official" | "wikipedia" | "default" {
  switch (license) {
    case "official-document":
      return "official";
    case "CC-BY-SA-4.0":
    case "CC-BY-4.0":
      return "wikipedia";
    default:
      return "default";
  }
}

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

// ⚠️ DE-Wortlaut (workshop.voiceConsole.defaultQueries) = TTS-Cache-Key —
// nicht umformulieren, sonst greift die vorvertonte Offline-Stimme nicht mehr.
const DEFAULT_SAMPLE_QUERY_COUNT = 5;

export function VoiceConsole({
  rag,
  guard,
  stt,
  tts,
  answer,
  makeAnswer,
  sampleQueries,
  mode,
}: VoiceConsoleProps) {
  const t = useTranslations("workshop.voiceConsole");
  const defaultQueries = useMemo(
    () =>
      Array.from({ length: DEFAULT_SAMPLE_QUERY_COUNT }, (_, i) =>
        t(`defaultQueries.${i}`),
      ),
    [t],
  );
  const queries = sampleQueries ?? defaultQueries;
  const effectiveMode: VoiceMode =
    mode ?? (makeAnswer || answer ? "server" : stt && tts ? "real" : "mock");
  const queryIdxRef = useRef(0);
  const [state, setState] = useState<VoicePipelineState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [audioPlayed, setAudioPlayed] = useState<boolean | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [dialog, setDialog] = useState<DialogTurn[]>([]);
  // Citation: die geerdete Quelle der letzten Antwort — sichtbarer Beweis,
  // dass die Stimme NICHTS erfindet (Pitch-Einwand "halluziniert die KI?").
  const [citation, setCitation] = useState<RAGCitation | null>(null);

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
    setCitation(null);

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
        // Quelle der Antwort anzeigen — selbe RAG-Grundlage, aus der die
        // Antwort stammt. Best-effort, bricht die Antwort nie.
        try {
          const cite = await rag.query(q, { topK: 1, minScore: 0.05 });
          const m = cite[0]?.metadata;
          if (m) {
            setCitation({
              label: typeof m.title === "string" ? m.title : String(m.source),
              license: typeof m.license === "string" ? m.license : undefined,
              url: typeof m.source_url === "string" ? m.source_url : undefined,
            });
          }
        } catch {
          /* keine Quelle gefunden — Badge bleibt aus */
        }
      }
      const played = await playPcmChunks(result.chunks);
      setAudioPlayed(played);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pipelineError"));
      // Pipeline-Crash lässt den Status sonst auf listening/speaking hängen
      // → Konsole wäre bis zum Reload busy-locked. Antwort/Frage bleiben.
      setState((s) => (s.status === "idle" ? s : { ...s, status: "idle" }));
    }
  };

  const handleMicClick = () => {
    const idx = queryIdxRef.current % queries.length;
    queryIdxRef.current += 1;
    void ask(queries[idx] ?? t("fallbackQuestion"));
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
  const badge = badgeFor(effectiveMode);
  const busyLabel =
    state.status === "listening" ||
    state.status === "thinking" ||
    state.status === "speaking"
      ? t(`status.${state.status}`)
      : "";

  return (
    <div
      data-testid="voice-console"
      className="cc-card cc-card--flat"
      style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleMicClick}
          disabled={busy}
          className="cc-btn cc-btn--primary cc-btn--sm"
        >
          🎤 {!busy ? t("askButton") : busyLabel}
        </button>
        <span
          className={`cc-badge ${badge.className}`}
          aria-label={`Voice mode: ${effectiveMode}`}
        >
          {t(`badge.${effectiveMode}`)}
        </span>
        {busy && (
          <span
            className="cc-muted"
            style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {state.status}
          </span>
        )}
      </div>

      {/* Demo-Fragen — der kontrollierte Pfad fuer die Vorfuehrung. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {queries.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void ask(q)}
            disabled={busy}
            className="cc-chip"
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
          placeholder={t("typedPlaceholder")}
          disabled={busy}
          aria-label={t("typedLabel")}
          className="cc-input"
        />
        <button
          type="button"
          onClick={handleTypedSubmit}
          disabled={busy || typed.trim().length === 0}
          className="cc-btn cc-btn--sm"
        >
          {t("typedSubmit")}
        </button>
      </div>

      {state.currentQuery && (
        <div
          className="cc-muted"
          style={{
            fontSize: "0.8rem",
            paddingTop: "0.5rem",
            borderTop: "1.5px solid var(--cc-line-soft)",
          }}
        >
          <strong>{t("questionLabel")}</strong> {state.currentQuery}
        </div>
      )}

      {state.currentResponse && (
        <div
          aria-live="polite"
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.55,
            padding: "0.6rem 0.75rem",
            background: "var(--cc-gray)",
            borderLeft: "4px solid var(--cc-yellow)",
          }}
        >
          {state.currentResponse}
        </div>
      )}

      {/* Citation-Badge: sichtbarer Beweis, dass die Antwort geerdet ist
          (kein Halluzinieren) — die Quelle aus dem Fachkorpus. */}
      {citation && state.currentResponse && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            flexWrap: "wrap",
            fontSize: "0.72rem",
          }}
        >
          <span className="cc-badge cc-badge--yellow">{t("sourceBadge")}</span>
          <span style={{ fontWeight: 600 }}>
            {t(`trust.${trustLabelKey(citation.license)}`)}
          </span>
          <span className="cc-muted">·</span>
          {citation.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noreferrer"
              className="cc-muted"
              style={{ borderBottom: "1.5px solid var(--cc-yellow)" }}
            >
              {citation.label}
            </a>
          ) : (
            <span className="cc-muted">{citation.label}</span>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {state.latencyMs &&
          (state.latencyMs.stt !== undefined ||
            state.latencyMs.llm !== undefined ||
            state.latencyMs.tts !== undefined) && (
            <span className="cc-mono cc-muted">
              stt:{state.latencyMs.stt ?? "—"}ms · llm:{state.latencyMs.llm ?? "—"}ms ·
              tts:{state.latencyMs.tts ?? "—"}ms
            </span>
          )}
        {audioPlayed === true && (
          <span style={{ fontSize: "0.72rem", color: "var(--cc-good)", fontWeight: 700 }}>
            {t("audioPlayed")}
          </span>
        )}
        {audioPlayed === false && state.currentResponse && (
          <span className="cc-muted" style={{ fontSize: "0.72rem" }}>
            {t("audioNone")}
          </span>
        )}
        {usedFallback && (
          <span
            className="cc-badge cc-badge--yellow"
            style={{ fontSize: "0.58rem" }}
          >
            {t("offlineFallback")}
          </span>
        )}
        {dialog.length > 0 && (
          <>
            <span className="cc-muted" style={{ fontSize: "0.72rem" }}>
              {t("dialogCount", { count: dialog.length })}
            </span>
            <button
              type="button"
              onClick={() => setDialog([])}
              disabled={busy}
              className="cc-chip"
            >
              {t("newDialog")}
            </button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" style={{ fontSize: "0.8rem", color: "var(--cc-bad)" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Sichtbare Badge-Texte kommen aus workshop.voiceConsole.badge.<mode>.
function badgeFor(mode: VoiceMode): { className: string } {
  switch (mode) {
    case "server":
      return { className: "cc-badge--dark" };
    case "real":
      return { className: "cc-badge--good" };
    default:
      return { className: "" };
  }
}

export { MockSTTProvider };
