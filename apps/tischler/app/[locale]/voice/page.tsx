"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { LocalRAGProvider } from "../../../lib/rag/local-rag";
import { KeywordTopicGuard } from "../../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../../lib/rag/corpus";
import { VoiceConsole } from "../../../components/VoiceConsole";
import { SiteFooter } from "../../../components/SiteFooter";
import { createServerAnswerFn } from "../../../lib/voice/server-providers";
import { useServerVoice } from "../../../lib/voice/use-server-voice";

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
  const t = useTranslations("voice");
  const appLocale: "de" | "en" = useLocale() === "en" ? "en" : "de";
  const { rag, guard } = useMemo(() => {
    const r = new LocalRAGProvider(getDemoCorpus(appLocale));
    const g = new KeywordTopicGuard({
      rag: r,
      onTopicMin: 0.25,
      offTopicMax: 0.05,
      blacklist: ["bitcoin", "krypto", "trading"],
    });
    return { rag: r, guard: g };
  }, [appLocale]);

  // Phase E: Server-Routen + TTS-Cache proben (shared Hook, gleiche Kette
  // wie die Werkstatt). Beides darf fehlen — die Console faellt dann auf
  // Mock/Template zurueck (Demo bricht nie).
  const { bundle, cacheCount, status: voiceStatus } = useServerVoice(rag, guard, appLocale);

  return (
    <>
      <main className="cc-page" style={{ maxWidth: 780 }}>
        <p className="cc-kicker">{t("kicker")}</p>
        <h1
          style={{
            margin: "0.5rem 0 0.75rem",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            textTransform: "uppercase",
          }}
        >
          {t.rich("h1", {
            mark: (chunks) => <span className="cc-mark">{chunks}</span>,
          })}
        </h1>
        <p className="cc-muted" style={{ lineHeight: 1.6, margin: 0 }}>
          {t("intro", { count: getDemoCorpus(appLocale).length })}
        </p>

        <section style={{ marginTop: "1.75rem" }}>
          {voiceStatus === "probing" ? (
            <p className="cc-muted" style={{ fontSize: "0.9rem" }}>
              {t("voiceConnecting")}
            </p>
          ) : bundle ? (
            <VoiceConsole
              rag={rag}
              guard={guard}
              tts={bundle.tts}
              answer={bundle.answer}
              makeAnswer={(history) => createServerAnswerFn(undefined, history, appLocale)}
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
            {t("offline.kicker")}
          </span>
          <p className="cc-muted" style={{ margin: "0.5rem 0 0" }}>
            {t.rich("offline.body", {
              count: cacheCount,
              code: (chunks) => <code className="cc-mono">{chunks}</code>,
            })}
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
