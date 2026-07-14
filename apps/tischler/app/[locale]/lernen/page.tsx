"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "../../../i18n/navigation";

// Canvas (R3F) ist client-only → dynamisch ohne SSR laden.
const AnreissLektion = dynamic(
  () => import("../../../components/AnreissLektion").then((m) => m.AnreissLektion),
  { ssr: false, loading: () => <AnreissLoading /> },
);
import { useMemo } from "react";
import { LocalRAGProvider } from "../../../lib/rag/local-rag";
import { KeywordTopicGuard } from "../../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../../lib/rag/corpus";
import { useServerVoice } from "../../../lib/voice/use-server-voice";
import { createServerAnswerFn } from "../../../lib/voice/server-providers";
import { VoiceConsole } from "../../../components/VoiceConsole";
import { ZinkenDiagram } from "../../../components/ZinkenDiagram";
import { SchwalbenwinkelWahl } from "../../../components/SchwalbenwinkelWahl";
import { OfflineTrust } from "../../../components/OfflineTrust";
import { SiteFooter } from "../../../components/SiteFooter";
import {
  getLernpfad,
  ZINKEN_GESCHICHTE,
  ZINKEN_ANWENDUNGEN,
  RIS_ANKER,
  type Zinkenart,
} from "../../../lib/zinken/zinkenarten";
import {
  getLernpfadEn,
  ZINKEN_GESCHICHTE_EN,
  ZINKEN_ANWENDUNGEN_EN,
  RIS_ANKER_EN,
} from "../../../lib/zinken/zinkenarten.en";

function AnreissLoading() {
  const t = useTranslations("learn");
  return <p className="cc-muted">{t("loading")}</p>;
}

function DiffDots({ level }: { level: 1 | 2 | 3 }) {
  const t = useTranslations("learn");
  return (
    <span className="cc-diff" aria-label={t("artCard.difficulty", { level })}>
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= level ? "on" : ""} />
      ))}
    </span>
  );
}

export default function LernenPage() {
  const t = useTranslations("learn");
  const appLocale: "de" | "en" = useLocale() === "en" ? "en" : "de";
  const en = appLocale === "en";
  const geschichte = en ? ZINKEN_GESCHICHTE_EN : ZINKEN_GESCHICHTE;
  const anwendungen = en ? ZINKEN_ANWENDUNGEN_EN : ZINKEN_ANWENDUNGEN;
  const risAnker = en ? RIS_ANKER_EN : RIS_ANKER;
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
  const { bundle: voiceBundle, status: voiceStatus } = useServerVoice(rag, guard);

  // Laien-Einstiegsfragen — der kontrollierte Rückfragen-Pfad für den Pitch.
  const overviewQueries = useMemo(
    () => Array.from({ length: 5 }, (_, i) => t(`overviewQueries.${i}`)),
    [t],
  );

  const pfad = en ? getLernpfadEn() : getLernpfad();

  return (
    <>
      <main className="cc-reader">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel" />
            <span>{t("hero.eyebrow")}</span>
          </div>
          <h1 className="cc-display">
            {t.rich("hero.h1", {
              hl: (chunks) => <span className="cc-hl">{chunks}</span>,
            })}
          </h1>
          <p className="cc-lead" style={{ marginTop: "1.25rem" }}>
            {t("hero.lead")}
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              marginTop: "1.25rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span className="cc-live">{t("hero.trust")}</span>
            <OfflineTrust />
          </div>
        </section>

        {/* ── GEFÜHRTES ANREISSEN (Tafel + Brett) ──────────────── */}
        <section style={{ marginTop: "2rem" }}>
          <AnreissLektion rag={rag} guard={guard} voiceBundle={voiceBundle} />
        </section>

        {/* ── WAS IST EIN ZINKEN ───────────────────────────────── */}
        <section
          className="cc-stack-sm"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: "clamp(1.5rem, 4vw, 3rem)",
            alignItems: "center",
          }}
        >
          <div>
            <p className="cc-kicker">{t("what.kicker")}</p>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                margin: "0.6rem 0 0.9rem",
              }}
            >
              {t("what.title")}
            </h2>
            <p className="cc-sub">
              {t.rich("what.body", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <p className="cc-note" style={{ marginTop: "1.1rem" }}>
              {t.rich("what.note", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
          <div className="cc-card" style={{ background: "var(--cc-paper-pure)" }}>
            <p
              className="cc-kicker"
              style={{ marginBottom: "0.75rem" }}
            >
              {t("what.diagramKicker")}
            </p>
            <ZinkenDiagram />
          </div>
        </section>

        {/* ── GESCHICHTE ───────────────────────────────────────── */}
        <section>
          <p className="cc-kicker">{t("history.kicker")}</p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.6rem 0 1.25rem",
            }}
          >
            {t.rich("history.title", {
              hl: (chunks) => <span className="cc-hl">{chunks}</span>,
            })}
          </h2>
          <div className="cc-grid-cards">
            {geschichte.map((g) => (
              <div key={g.epoche} className="cc-card cc-card--flat">
                <p className="cc-kicker" style={{ marginBottom: "0.5rem" }}>
                  {g.epoche}
                </p>
                <p className="cc-muted" style={{ margin: 0, lineHeight: 1.55 }}>
                  {g.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WOFÜR ────────────────────────────────────────────── */}
        <section>
          <p className="cc-kicker">{t("uses.kicker")}</p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.6rem 0 1rem",
            }}
          >
            {t.rich("uses.title", {
              hl: (chunks) => <span className="cc-hl">{chunks}</span>,
            })}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {anwendungen.map((a) => (
              <span
                key={a}
                className="cc-chip"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              >
                {a}
              </span>
            ))}
          </div>
        </section>

        {/* ── SCHWALBENWINKEL ──────────────────────────────────── */}
        <section>
          <p className="cc-kicker">{t("angle.kicker")}</p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.6rem 0 0.5rem",
            }}
          >
            {t.rich("angle.title", {
              hl: (chunks) => <span className="cc-hl">{chunks}</span>,
            })}
          </h2>
          <p className="cc-sub" style={{ marginBottom: "1.25rem" }}>
            {t("angle.sub")}
          </p>
          <div className="cc-card" style={{ background: "var(--cc-paper-pure)" }}>
            <SchwalbenwinkelWahl />
          </div>
        </section>

        {/* ── LERNPFAD ─────────────────────────────────────────── */}
        <section>
          <p className="cc-kicker">{t("path.kicker")}</p>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)",
              margin: "0.6rem 0 0.5rem",
            }}
          >
            {t.rich("path.title", {
              hl: (chunks) => <span className="cc-hl">{chunks}</span>,
            })}
          </h2>
          <p className="cc-sub" style={{ marginBottom: "0.4rem" }}>
            {t("path.sub")}
          </p>
          <div className="cc-pathline" style={{ marginBottom: "1.5rem" }}>
            {pfad.map((z, i) => (
              <span key={z.id} style={{ display: "inline-flex", gap: "0.5rem" }}>
                <span>
                  {z.order}. {z.name}
                </span>
                {i < pfad.length - 1 && <span className="cc-arrow">→</span>}
              </span>
            ))}
          </div>

          <div className="cc-art-grid">
            {pfad.map((z) => (
              <ArtCard key={z.id} art={z} />
            ))}
          </div>

          <p className="cc-note cc-note--official" style={{ marginTop: "1.5rem" }}>
            {t.rich("ris.note", {
              strong: (chunks) => <strong>{chunks}</strong>,
              em: (chunks) => <em>{chunks}</em>,
              aoTitel: risAnker.ausbildungsordnung.titel,
              gesNr: risAnker.ausbildungsordnung.gesetzesnummer,
              lpTitel: risAnker.lehrplan.titel,
              zitat: risAnker.lehrplan.zitat,
            })}{" "}
            <a
              href={risAnker.ausbildungsordnung.url}
              target="_blank"
              rel="noreferrer"
              style={{ borderBottom: "2px solid var(--cc-yellow)" }}
            >
              {t("ris.sourceLink")}
            </a>
          </p>
        </section>

        {/* ── MEISTER FRAGEN ───────────────────────────────────── */}
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel cc-winkel--sm" />
            <span>{t("ask.eyebrow")}</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.4rem 0 0.9rem",
            }}
          >
            {t("ask.title")}
          </h2>
          <p className="cc-sub" style={{ marginBottom: "1rem" }}>
            {t("ask.sub")}
          </p>
          <div style={{ maxWidth: 640 }}>
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
                sampleQueries={overviewQueries}
              />
            ) : (
              <VoiceConsole
                rag={rag}
                guard={guard}
                sampleQueries={overviewQueries}
              />
            )}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section>
          <div className="cc-card cc-card--dark">
            <p className="cc-kicker" style={{ color: "var(--cc-yellow)" }}>
              <span style={{ color: "var(--cc-paper)" }}>{t("cta.kicker")}</span>
            </p>
            <h2
              style={{
                color: "var(--cc-paper)",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                margin: "0.6rem 0 1rem",
                maxWidth: "22ch",
              }}
            >
              {t("cta.title")}
            </h2>
            <Link href="/werkstatt" className="cc-btn cc-btn--primary">
              {t("cta.button")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ArtCard({ art }: { art: Zinkenart }) {
  const t = useTranslations("learn");
  return (
    <article className="cc-art-card" data-active={art.playable ? "true" : undefined}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span className="cc-order-num">{t("artCard.step", { order: art.order })}</span>
        <DiffDots level={art.schwierigkeit} />
      </div>
      <h3
        style={{
          fontSize: "1.15rem",
          margin: "0.2rem 0 0",
          lineHeight: 1.2,
          overflowWrap: "anywhere",
          hyphens: "auto",
        }}
      >
        {art.name}
      </h3>
      <p
        style={{
          margin: 0,
          fontWeight: 600,
          fontSize: "0.9rem",
          color: "var(--cc-ink-soft)",
        }}
      >
        {art.kurz}
      </p>
      <p className="cc-muted" style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
        {art.was}
      </p>
      <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.5 }}>
        <strong>{t("artCard.when")}</strong>{" "}
        <span className="cc-muted">{art.wann}</span>
      </p>
      <p
        style={{
          margin: "0.2rem 0 0",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          fontStyle: "italic",
          borderLeft: "4px solid var(--cc-yellow)",
          paddingLeft: "0.7rem",
          color: "var(--cc-ink)",
        }}
      >
        {t("artCard.master", { text: art.voiceIntro })}
      </p>
      <div style={{ marginTop: "auto", paddingTop: "0.6rem" }}>
        {art.playable && art.href ? (
          <Link href={art.href} className="cc-btn cc-btn--primary cc-btn--sm">
            {t("artCard.learnCta")}
          </Link>
        ) : (
          <span className="cc-badge">{t("artCard.preparing")}</span>
        )}
      </div>
    </article>
  );
}
