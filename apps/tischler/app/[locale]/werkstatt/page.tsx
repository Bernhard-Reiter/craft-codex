"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_DOVETAIL_PARAMS } from "@craft-codex/core";
import { Link } from "../../../i18n/navigation";
import { DovetailScene } from "../../../components/DovetailSceneDynamic";
import { SceneBoundary, SceneFallback } from "../../../components/SceneBoundary";
import { ZinkenDiagram } from "../../../components/ZinkenDiagram";
import { VoiceConsole } from "../../../components/VoiceConsole";
import { OfflineTrust } from "../../../components/OfflineTrust";
import { SiteFooter } from "../../../components/SiteFooter";
import { playPcmChunks } from "../../../lib/voice/pcm-player";
import { LocalRAGProvider } from "../../../lib/rag/local-rag";
import { KeywordTopicGuard } from "../../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../../lib/rag/corpus";
import { useServerVoice } from "../../../lib/voice/use-server-voice";
import { createServerAnswerFn } from "../../../lib/voice/server-providers";
import { getLektion } from "../../../lib/zinken/lektion";
import { getLektionEn } from "../../../lib/zinken/lektion.en";

/**
 * Geführte Werkstatt — die interaktive Regie-Bühne (Slice 1).
 * Modell: GEFÜHRT + KI-Assist. Fester Beat-Pfad (pitch-sicher), der Meister
 * erzählt jeden Beat, Stimme jederzeit fragbar, XR-Übergabe als Höhepunkt.
 */
export default function WerkstattPage() {
  const t = useTranslations("workshop");
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
  const { bundle: voiceBundle, status: voiceStatus } = useServerVoice(rag, guard, appLocale);

  const lektion = appLocale === "en" ? getLektionEn() : getLektion();
  const [i, setI] = useState(0);
  const beat = lektion[i]!;
  const atStart = i === 0;
  const atEnd = i === lektion.length - 1;

  // Kiosk-Modus (?kiosk=1): narrensichere Pitch-Demo — Chrome aus,
  // Auto-Advance. Manuelle Steuerung bleibt zusätzlich möglich.
  const [kiosk, setKiosk] = useState(false);
  useEffect(() => {
    const on = new URLSearchParams(window.location.search).get("kiosk") === "1";
    setKiosk(on);
    if (on) document.body.classList.add("cc-kiosk");
    return () => document.body.classList.remove("cc-kiosk");
  }, []);
  useEffect(() => {
    if (!kiosk) return;
    const timer = setInterval(
      () => setI((n) => (n < lektion.length - 1 ? n + 1 : n)),
      35000,
    );
    return () => clearInterval(timer);
  }, [kiosk, lektion.length]);

  // Meister liest den Beat vor (Google-TTS via Bundle: Cache → live Gemini).
  // AbortController statt bool-Flag: kein „klemmender Abbruch" mehr, und der
  // Beat-Wechsel stoppt sauber eine laufende Wiedergabe.
  const [speaking, setSpeaking] = useState(false);
  const speakCtrl = useRef<AbortController | null>(null);
  async function vorlesen(text: string) {
    if (!voiceBundle || speaking) return;
    const ctrl = new AbortController();
    speakCtrl.current = ctrl;
    setSpeaking(true);
    try {
      const chunks = [];
      for await (const c of voiceBundle.tts.synthesizeStream(text)) {
        if (ctrl.signal.aborted) break;
        chunks.push(c);
      }
      if (!ctrl.signal.aborted) await playPcmChunks(chunks);
    } catch {
      /* Stimme nicht verfügbar — Text bleibt sichtbar (Untertitel-Fallback) */
    } finally {
      setSpeaking(false);
      if (speakCtrl.current === ctrl) speakCtrl.current = null;
    }
  }
  // Beim Beat-Wechsel laufende Wiedergabe stoppen.
  useEffect(() => {
    speakCtrl.current?.abort();
  }, [i]);

  return (
    <>
      <main className="cc-workbench">
        <aside className="cc-workbench-rail">
          <header>
            <p className="cc-kicker">{t("rail.kicker")}</p>
            <h1 style={{ margin: "0.4rem 0 0", fontSize: "1.5rem" }}>
              {t("rail.title")}
            </h1>
            <p
              className="cc-muted"
              style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}
            >
              {t("rail.sub")}
            </p>
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
              <OfflineTrust />
              {kiosk && (
                <span className="cc-badge cc-badge--yellow" style={{ fontSize: "0.6rem" }}>
                  {t("rail.kioskBadge")}
                </span>
              )}
            </div>
          </header>

          {/* Beat-Leiste: Fortschritt + Sprung */}
          <div role="group" aria-label={t("rail.beatsLabel")} className="cc-tabbar">
            {lektion.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={idx === i}
                onClick={() => setI(idx)}
                className="cc-tab"
                style={{ fontSize: "0.78rem" }}
              >
                <span className="cc-tab-step" aria-hidden="true">
                  {idx === lektion.length - 1 ? "▸" : idx + 1}
                </span>
                {b.label}
              </button>
            ))}
          </div>

          {/* Meister-Panel: was er bei diesem Beat sagt */}
          <section className="cc-card">
            <p className="cc-kicker" style={{ marginBottom: "0.5rem" }}>
              {beat.titel}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                lineHeight: 1.55,
                fontStyle: "italic",
                borderLeft: "4px solid var(--cc-yellow)",
                paddingLeft: "0.8rem",
              }}
            >
              {t("beat.master", { text: beat.meisterSays })}
            </p>
            {voiceBundle && (
              <button
                type="button"
                className="cc-btn cc-btn--sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => void vorlesen(beat.meisterSays)}
                disabled={speaking}
              >
                {speaking ? t("beat.speaking") : t("beat.readAloud")}
              </button>
            )}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "1rem",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="cc-btn cc-btn--sm"
                onClick={() => setI((n) => Math.max(0, n - 1))}
                disabled={atStart}
              >
                {t("beat.back")}
              </button>
              <span
                className="cc-mono cc-muted"
                style={{ flex: 1, textAlign: "center" }}
              >
                {t("beat.counter", { current: i + 1, total: lektion.length })}
              </span>
              {!atEnd ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--primary cc-btn--sm"
                  onClick={() => setI((n) => Math.min(lektion.length - 1, n + 1))}
                >
                  {t("beat.next")}
                </button>
              ) : (
                <Link
                  href={beat.href ?? "/dovetail/xr"}
                  className="cc-btn cc-btn--primary cc-btn--sm"
                >
                  {t("beat.startXr")}
                </Link>
              )}
            </div>
          </section>

          {/* KI-Assist: jederzeit fragen */}
          <section>
            <p className="cc-kicker" style={{ marginBottom: "0.6rem" }}>
              {t("ask.kicker")}
            </p>
            {voiceStatus === "probing" ? (
              <p className="cc-muted" style={{ fontSize: "0.85rem" }}>
                {t("ask.connecting")}
              </p>
            ) : voiceBundle ? (
              <VoiceConsole
                rag={rag}
                guard={guard}
                tts={voiceBundle.tts}
                answer={voiceBundle.answer}
                makeAnswer={(history) => createServerAnswerFn(undefined, history, appLocale)}
                mode={voiceBundle.mode}
              />
            ) : (
              <VoiceConsole rag={rag} guard={guard} />
            )}
          </section>
        </aside>

        {/* BÜHNE — zeigt die Fläche des aktiven Beats */}
        <section
          className="cc-stage"
          aria-label={t("stage.label")}
          style={{ gridRow: "1 / span 2" }}
        >
          <div
            style={{
              position: "absolute",
              top: "0.6rem",
              left: "0.6rem",
              zIndex: 2,
              background: "var(--cc-paper)",
              borderRadius: "var(--cc-radius-sm)",
              padding: "0.3rem 0.7rem",
              fontSize: "0.72rem",
              fontWeight: 600,
              boxShadow: "var(--cc-emboss)",
            }}
          >
            {beat.label}
          </div>

          {beat.surface === "joint3d" && beat.step ? (
            <SceneBoundary
              fallback={
                <SceneFallback>
                  <ZinkenDiagram showLabels={false} />
                </SceneFallback>
              }
            >
              <DovetailScene params={DEFAULT_DOVETAIL_PARAMS} step={beat.step} />
            </SceneBoundary>
          ) : beat.surface === "xr" ? (
            <XRHandoff href={beat.href ?? "/dovetail/xr"} />
          ) : (
            <SceneBoundary
              fallback={
                <SceneFallback>
                  <ZinkenDiagram showLabels={false} />
                </SceneFallback>
              }
            >
              <DovetailScene params={DEFAULT_DOVETAIL_PARAMS} step="ueberblick" />
            </SceneBoundary>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function XRHandoff({ href }: { href: string }) {
  const t = useTranslations("workshop");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "1.25rem",
        padding: "2rem",
        color: "var(--cc-paper)",
      }}
    >
      <span className="cc-live" style={{ color: "var(--cc-paper)" }}>
        Quest 3 · Galaxy XR
      </span>
      <h2
        style={{
          color: "var(--cc-paper)",
          fontSize: "clamp(1.5rem, 3vw, 2.4rem)",
          maxWidth: "18ch",
        }}
      >
        {t("xrHandoff.title")}
      </h2>
      <p
        style={{
          color: "var(--cc-paper)",
          opacity: 0.8,
          maxWidth: "40ch",
          lineHeight: 1.5,
        }}
      >
        {t("xrHandoff.body")}
      </p>
      <Link href={href} className="cc-btn cc-btn--primary">
        {t("xrHandoff.cta")}
      </Link>
    </div>
  );
}
