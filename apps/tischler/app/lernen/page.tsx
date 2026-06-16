"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LocalRAGProvider } from "../../lib/rag/local-rag";
import { StubTopicGuard } from "../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../lib/rag/corpus";
import { useServerVoice } from "../../lib/voice/use-server-voice";
import { createServerAnswerFn } from "../../lib/voice/server-providers";
import { VoiceConsole } from "../../components/VoiceConsole";
import { ZinkenDiagram } from "../../components/ZinkenDiagram";
import { SiteFooter } from "../../components/SiteFooter";
import {
  getLernpfad,
  ZINKEN_GESCHICHTE,
  ZINKEN_ANWENDUNGEN,
  RIS_ANKER,
  type Zinkenart,
} from "../../lib/zinken/zinkenarten";

// Laien-Einstiegsfragen — der kontrollierte Rückfragen-Pfad für den Pitch.
const OVERVIEW_QUERIES: ReadonlyArray<string> = [
  "Was ist ein Zinken?",
  "Wofür sind Zinken gut?",
  "Welche Zinkenarten gibt es?",
  "Warum hält das ohne Schrauben?",
  "Womit fange ich am besten an?",
];

function DiffDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="cc-diff" aria-label={`Schwierigkeit ${level} von 3`}>
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= level ? "on" : ""} />
      ))}
    </span>
  );
}

export default function LernenPage() {
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
  const { bundle: voiceBundle } = useServerVoice(rag, guard);

  const pfad = getLernpfad();

  return (
    <>
      <main className="cc-reader">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel" />
            <span>Überblick · von ganz vorne</span>
          </div>
          <h1 className="cc-display">
            Zinken — die <span className="cc-hl">Königsdisziplin</span> der
            Holzverbindung.
          </h1>
          <p className="cc-lead" style={{ marginTop: "1.25rem" }}>
            Bevor der erste Strich aufs Holz kommt: Was ist ein Zinken, wofür ist
            er gut, und welche Arten gibt es? Erst verstehen — dann anreißen.
          </p>
          <p className="cc-live" style={{ marginTop: "1.25rem" }}>
            Jede Antwort aus geprüftem Meisterwissen
          </p>
        </section>

        {/* ── WAS IST EIN ZINKEN ───────────────────────────────── */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: "clamp(1.5rem, 4vw, 3rem)",
            alignItems: "center",
          }}
        >
          <div>
            <p className="cc-kicker">Was ist das?</p>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                margin: "0.6rem 0 0.9rem",
              }}
            >
              Zwei Bretter, die ineinandergreifen wie die Finger zweier Hände.
            </h2>
            <p className="cc-sub">
              An der Stirnseite — dem <strong>Hirnholz</strong> — wird jedes
              Brett kammartig ausgeschnitten. Schiebt man die Bretter über Eck
              zusammen, greift jeder <strong>Zinken</strong> in die Lücke des
              anderen. Beim Schwalbenschwanz sind die Zinken keilförmig: sie{" "}
              <strong>verriegeln sich</strong> und halten sogar ohne Leim oder
              Schraube.
            </p>
            <p className="cc-note" style={{ marginTop: "1.1rem" }}>
              Das nennt der Tischler <strong>Formschluss</strong> — die Form
              selbst hält die Ecke zusammen. Darum ist der Schwalbenschwanz die
              stabilste Eckverbindung im Möbelbau.
            </p>
          </div>
          <div className="cc-card" style={{ background: "var(--cc-paper-pure)" }}>
            <p
              className="cc-kicker"
              style={{ marginBottom: "0.75rem" }}
            >
              Zieh die Verbindung auseinander
            </p>
            <ZinkenDiagram />
          </div>
        </section>

        {/* ── GESCHICHTE ───────────────────────────────────────── */}
        <section>
          <p className="cc-kicker">Die Geschichte</p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.6rem 0 1.25rem",
            }}
          >
            Älter als man denkt — und <span className="cc-hl">nie veraltet</span>
            .
          </h2>
          <div className="cc-grid-cards">
            {ZINKEN_GESCHICHTE.map((g) => (
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
          <p className="cc-kicker">Wofür man sie braucht</p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.6rem 0 1rem",
            }}
          >
            Überall, wo eine Ecke <span className="cc-hl">halten muss</span>.
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {ZINKEN_ANWENDUNGEN.map((a) => (
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

        {/* ── LERNPFAD ─────────────────────────────────────────── */}
        <section>
          <p className="cc-kicker">Der Lernpfad</p>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)",
              margin: "0.6rem 0 0.5rem",
            }}
          >
            Welchen Zinken willst du <span className="cc-hl">lernen</span>?
          </h2>
          <p className="cc-sub" style={{ marginBottom: "0.4rem" }}>
            Empfohlene Reihenfolge vom einfachen Einstieg zum Meisterstück:
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
            <strong>Amtlich verankert.</strong> Die{" "}
            {RIS_ANKER.ausbildungsordnung.titel} (RIS, GesNr{" "}
            {RIS_ANKER.ausbildungsordnung.gesetzesnummer}) schreibt{" "}
            <em>Anreißen</em> und <em>Zinkenverbindungen</em> wörtlich als
            Pflichtkompetenz vor; der {RIS_ANKER.lehrplan.titel} nennt{" "}
            {RIS_ANKER.lehrplan.zitat}. Dieses Lerntool deckt damit exakt eine
            vorgeschriebene Kernkompetenz der Tischler-Lehre ab.{" "}
            <a
              href={RIS_ANKER.ausbildungsordnung.url}
              target="_blank"
              rel="noreferrer"
              style={{ borderBottom: "2px solid var(--cc-yellow)" }}
            >
              Quelle ansehen
            </a>
          </p>
        </section>

        {/* ── MEISTER FRAGEN ───────────────────────────────────── */}
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel cc-winkel--sm" />
            <span>Stimme des Meisters</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              margin: "0.4rem 0 0.9rem",
            }}
          >
            Frag, wie am Hobel nebenan.
          </h2>
          <p className="cc-sub" style={{ marginBottom: "1rem" }}>
            Stell eine Frage — die Antwort kommt aus dem geprüften Fachkorpus,
            mit Quelle, auch komplett ohne Netz.
          </p>
          <div style={{ maxWidth: 640 }}>
            {voiceBundle ? (
              <VoiceConsole
                rag={rag}
                guard={guard}
                tts={voiceBundle.tts}
                answer={voiceBundle.answer}
                makeAnswer={(history) => createServerAnswerFn(undefined, history)}
                mode={voiceBundle.mode}
                sampleQueries={OVERVIEW_QUERIES}
              />
            ) : (
              <VoiceConsole
                rag={rag}
                guard={guard}
                sampleQueries={OVERVIEW_QUERIES}
              />
            )}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section>
          <div className="cc-card cc-card--dark">
            <p className="cc-kicker" style={{ color: "var(--cc-yellow)" }}>
              <span style={{ color: "var(--cc-paper)" }}>Bereit?</span>
            </p>
            <h2
              style={{
                color: "var(--cc-paper)",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                margin: "0.6rem 0 1rem",
                maxWidth: "22ch",
              }}
            >
              Lern den Schwalbenschwanz — Schritt für Schritt am 3D-Werkstück.
            </h2>
            <Link href="/dovetail" className="cc-btn cc-btn--primary">
              Werkstatt öffnen →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ArtCard({ art }: { art: Zinkenart }) {
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
        <span className="cc-order-num">SCHRITT {art.order}</span>
        <DiffDots level={art.schwierigkeit} />
      </div>
      <h3
        style={{
          fontSize: "1.1rem",
          textTransform: "uppercase",
          margin: "0.2rem 0 0",
          lineHeight: 1.15,
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
        <strong>Wann:</strong> <span className="cc-muted">{art.wann}</span>
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
        Der Meister: „{art.voiceIntro}“
      </p>
      <div style={{ marginTop: "auto", paddingTop: "0.6rem" }}>
        {art.playable && art.href ? (
          <Link href={art.href} className="cc-btn cc-btn--primary cc-btn--sm">
            Diesen lernen →
          </Link>
        ) : (
          <span className="cc-badge">In Vorbereitung · Stimme erklärt schon</span>
        )}
      </div>
    </article>
  );
}
