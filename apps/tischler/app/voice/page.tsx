"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LocalRAGProvider } from "../../lib/rag/local-rag";
import { StubTopicGuard } from "../../lib/rag/topic-guard";
import { getDovetailCorpus } from "../../lib/rag/corpus/dovetail-corpus";
import { VoiceConsole } from "../../components/VoiceConsole";
import {
  createServerVoiceProviders,
  type VoiceProviderBundle,
} from "../../lib/voice/factory";
import { probeServerVoice } from "../../lib/voice/server-providers";
import { EMPTY_MANIFEST, type TTSCacheManifest } from "../../lib/voice/tts-cache";

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

  // Phase E: Server-Routen + TTS-Cache proben. Beides darf fehlen —
  // die Console faellt dann auf Mock/Template zurueck (Demo bricht nie).
  const [bundle, setBundle] = useState<VoiceProviderBundle | null>(null);
  const [cacheCount, setCacheCount] = useState(0);

  useEffect(() => {
    let on = true;
    (async () => {
      const [health, manifest] = await Promise.all([
        probeServerVoice(),
        fetch("/tts-cache/manifest.json", { cache: "no-store" })
          .then((r) => (r.ok ? (r.json() as Promise<TTSCacheManifest>) : EMPTY_MANIFEST))
          .catch(() => EMPTY_MANIFEST),
      ]);
      if (!on) return;
      setCacheCount(Object.keys(manifest.entries ?? {}).length);
      if (health?.ok) {
        setBundle(
          createServerVoiceProviders({ rag, guard, health, ttsCacheManifest: manifest }),
        );
      } else {
        setBundle(null); // statisches Hosting / komplett offline → Mock-Console
      }
    })();
    return () => {
      on = false;
    };
  }, [rag, guard]);

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <Link href="/" style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
        ← zurueck
      </Link>
      <h1 style={{ marginTop: "1rem", fontSize: "1.6rem", fontWeight: 600 }}>
        Voice-Konsole
      </h1>
      <p style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
        Frage per Demo-Button, Texteingabe oder Mic-Rotation stellen. Antworten
        kommen aus dem 41-Doc-RAG-Korpus (Server-Route mit Claude, sonst
        Template). Stimme: Offline-Cache zuerst, dann Server-ElevenLabs.
      </p>

      <section style={{ marginTop: "1.5rem" }}>
        {bundle ? (
          <VoiceConsole
            rag={rag}
            guard={guard}
            tts={bundle.tts}
            answer={bundle.answer}
            sampleQueries={SAMPLE_QUERIES}
            mode={bundle.mode}
          />
        ) : (
          <VoiceConsole rag={rag} guard={guard} sampleQueries={SAMPLE_QUERIES} />
        )}
      </section>

      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          fontSize: "0.8rem",
          lineHeight: 1.5,
          color: "var(--color-muted)",
        }}
      >
        Offline-Kette: vorberechnete Stimme ({cacheCount} Antworten im Cache) →
        Server-TTS → Stille mit Text-Antwort. Antworten funktionieren immer —
        notfalls aus dem lokalen Wissenskorpus. Cache befuellen:{" "}
        <code>ELEVENLABS_API_KEY=… pnpm tts:cache</code>
      </section>
    </main>
  );
}
