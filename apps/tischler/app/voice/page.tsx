"use client";

import { useEffect, useMemo, useState } from "react";
import { LocalRAGProvider } from "../../lib/rag/local-rag";
import { StubTopicGuard } from "../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../lib/rag/corpus";
import { VoiceConsole } from "../../components/VoiceConsole";
import { SiteFooter } from "../../components/SiteFooter";
import {
  createServerVoiceProviders,
  type VoiceProviderBundle,
} from "../../lib/voice/factory";
import { probeServerVoice, createServerAnswerFn } from "../../lib/voice/server-providers";
import { EMPTY_MANIFEST, type TTSCacheManifest } from "../../lib/voice/tts-cache";

// ⚠️ Wortlaut = TTS-Cache-Key — nicht umformulieren, sonst greift die
// vorvertonte Offline-Stimme nicht mehr.
const SAMPLE_QUERIES = [
  "Wie reisse ich mit dem Streichmass an",
  "Welcher Schwalbenwinkel passt fuer Hartholz",
  "Was ist beim Stemmeisen schaerfen wichtig",
  "Auf welcher Seite der Anrisslinie saege ich",
  "Wie pruefe ich die Passung am Ende",
] as const;

export default function VoiceTestPage() {
  const { rag, guard } = useMemo(() => {
    const r = new LocalRAGProvider(getDemoCorpus());
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
    <>
      <main className="cc-page" style={{ maxWidth: 780 }}>
        <p className="cc-kicker">Werkstück 02</p>
        <h1
          style={{
            margin: "0.5rem 0 0.75rem",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            textTransform: "uppercase",
          }}
        >
          Stimme des <span className="cc-mark">Meisters</span>
        </h1>
        <p className="cc-muted" style={{ lineHeight: 1.6, margin: 0 }}>
          Frage per Demo-Button, Texteingabe oder Mikrofon stellen. Antworten
          kommen aus dem Fachkorpus ({getDemoCorpus().length} Dokumente, inkl.
          offizieller Regelwerke) — gesprochen über die Offline-Kette:
          vorvertonter Cache zuerst, dann Server-Stimme, notfalls Text.
        </p>

        <section style={{ marginTop: "1.75rem" }}>
          {bundle ? (
            <VoiceConsole
              rag={rag}
              guard={guard}
              tts={bundle.tts}
              answer={bundle.answer}
              makeAnswer={(history) => createServerAnswerFn(undefined, history)}
              sampleQueries={SAMPLE_QUERIES}
              mode={bundle.mode}
            />
          ) : (
            <VoiceConsole rag={rag} guard={guard} sampleQueries={SAMPLE_QUERIES} />
          )}
        </section>

        <section
          className="cc-card cc-card--gray cc-card--flat"
          style={{ marginTop: "1.25rem", fontSize: "0.8rem", lineHeight: 1.6 }}
        >
          <span className="cc-kicker" style={{ marginBottom: "0.5rem" }}>
            Offline-Kette
          </span>
          <p className="cc-muted" style={{ margin: "0.5rem 0 0" }}>
            Vorberechnete Stimme ({cacheCount} Antworten im Cache) →
            Server-TTS → Stille mit Text-Antwort. Antworten funktionieren
            immer — notfalls aus dem lokalen Wissenskorpus. Cache befüllen:{" "}
            <code className="cc-mono">ELEVENLABS_API_KEY=… pnpm tts:cache</code>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
