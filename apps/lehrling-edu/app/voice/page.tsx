"use client";

import { useMemo } from "react";
import Link from "next/link";
import { LocalRAGProvider } from "../../lib/rag/local-rag";
import { StubTopicGuard } from "../../lib/rag/topic-guard";
import { getDovetailCorpus } from "../../lib/rag/corpus/dovetail-corpus";
import { VoiceConsole } from "../../components/VoiceConsole";

const SAMPLE_QUERIES = [
  "Wie reisse ich mit dem Streichmass an",
  "Welcher Schwalbenwinkel passt fuer Hartholz",
  "Was ist beim Stemmeisen schaerfen wichtig",
  "Auf welcher Seite der Anrisslinie saege ich",
  "Wie pruefe ich die Passung am Ende",
] as const;

export default function VoiceTestPage() {
  const { rag, guard } = useMemo(() => {
    const r = new LocalRAGProvider(getDovetailCorpus());
    const g = new StubTopicGuard({
      rag: r,
      onTopicMin: 0.25,
      offTopicMax: 0.05,
      blacklist: ["bitcoin", "krypto", "trading"],
    });
    return { rag: r, guard: g };
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <Link
        href="/"
        style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}
      >
        ← zurueck
      </Link>
      <h1 style={{ marginTop: "1rem", fontSize: "1.6rem", fontWeight: 600 }}>
        Voice-Pipeline Test (Phase C)
      </h1>
      <p style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
        Klick auf den Mic-Button rotiert durch 5 Sample-Queries. Die Pipeline
        nutzt den 41-Doc RAG-Korpus + 3-Layer-TopicGuard und antwortet
        Template-basiert (Phase D ersetzt durch Claude SSE). MockTTS spielt
        Stille.
      </p>

      <section style={{ marginTop: "1.5rem" }}>
        <VoiceConsole rag={rag} guard={guard} sampleQueries={SAMPLE_QUERIES} />
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          fontSize: "0.85rem",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ display: "block", marginBottom: "0.5rem" }}>
          Sample-Queries (rotieren):
        </strong>
        <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
          {SAMPLE_QUERIES.map((q) => (
            <li key={q} style={{ color: "var(--color-muted)" }}>
              {q}
            </li>
          ))}
        </ol>
      </section>

      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "rgba(255, 184, 74, 0.08)",
          border: "1px solid rgba(255, 184, 74, 0.3)",
          borderRadius: 6,
          fontSize: "0.85rem",
          lineHeight: 1.5,
        }}
      >
        <strong>Disclaimer:</strong> Phase C — Mock STT/TTS, Template-Synth.
        Antworten sind echte RAG-Hits aus dem Korpus mit Quellen-Attribution.
        Phase D: Whisper streaming + Claude SSE + ElevenLabs Flash v2.
      </section>
    </main>
  );
}
