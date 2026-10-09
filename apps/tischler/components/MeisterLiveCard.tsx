"use client";

import { useEffect, useRef, useState } from "react";
import { MeisterLive, type LiveStatus } from "../lib/voice/realtime-client";
import type { RealtimeThema } from "../lib/voice/realtime-config";
import type { WissensTreffer } from "../lib/voice/wissen-suche";

/** Nur Link (neues Fenster), keine Inhalte von BIC.at (Impressum: persoenliche Verwendung). */
const BIC_LEHRBERUF_URL = "https://www.bic.at/berufsinformation.php?brfid=2952";

const TEXT = {
  de: {
    kicker: "Live · Sprechen wie mit einem Menschen",
    titel: "Mit dem Meister reden",
    intro:
      "Drück auf den Knopf und frag einfach drauf los. Du kannst jederzeit reinreden. Bei Fragen zu Ausbildung und Berufsschule schaut der Meister im RIS nach und zeigt dir die Quelle.",
    start: "🎙 Gespräch starten",
    stop: "■ Auflegen",
    status: {
      bereit: "Bereit",
      verbinde: "Verbinde …",
      hoert: "Ich höre zu",
      spricht: "Meister spricht",
      denkt: "Meister denkt nach …",
      beendet: "Gespräch beendet",
      fehler: "Keine Verbindung",
    },
    rest: "Restzeit",
    quellen: "Quellen aus dem Gespräch",
    amtlich: "Amtlich · RIS",
    oeffnen: "Im RIS öffnen ↗",
    wikipedia: "Wikipedia · CC BY-SA 4.0",
    oeffnenWiki: "Auf Wikipedia öffnen ↗",
    bic: "Mehr zum Lehrberuf auf BIC.at ↗",
    du: "Du",
    meister: "Meister",
    fehler:
      "Die Live-Verbindung klappt gerade nicht. Unten kannst du dem Meister weiter Fragen per Knopf stellen.",
    mikro: "Bitte erlaube den Zugriff aufs Mikrofon.",
    hinweis: "RIS-Auszüge (Fassung tagesaktuell geerntet) und Wikipedia (CC BY-SA 4.0) — keine vollständige Rechtsauskunft.",
  },
  en: {
    kicker: "Live · talk like with a person",
    titel: "Talk to the master",
    intro:
      "Press the button and just ask. You can interrupt at any time. For questions about the apprenticeship and vocational school the master looks it up in RIS and shows you the source.",
    start: "🎙 Start conversation",
    stop: "■ Hang up",
    status: {
      bereit: "Ready",
      verbinde: "Connecting …",
      hoert: "Listening",
      spricht: "Master is speaking",
      denkt: "Master is thinking …",
      beendet: "Conversation ended",
      fehler: "No connection",
    },
    rest: "Time left",
    quellen: "Sources from the conversation",
    amtlich: "Official · RIS",
    oeffnen: "Open in RIS ↗",
    wikipedia: "Wikipedia · CC BY-SA 4.0",
    oeffnenWiki: "Open on Wikipedia ↗",
    bic: "More about the apprenticeship on BIC.at (German) ↗",
    du: "You",
    meister: "Master",
    fehler: "The live connection isn't working right now. Below you can keep asking the master by button.",
    mikro: "Please allow microphone access.",
    hinweis: "RIS excerpts (harvested daily) and Wikipedia (CC BY-SA 4.0) — not complete legal advice.",
  },
} as const;

interface Zeile {
  id: string;
  wer: "du" | "meister";
  text: string;
}

function mmss(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function MeisterLiveCard({ locale, thema = "allgemein" }: { locale: "de" | "en"; thema?: RealtimeThema }) {
  const t = TEXT[locale];
  const [status, setStatus] = useState<LiveStatus>("bereit");
  const [zeilen, setZeilen] = useState<Zeile[]>([]);
  const [quellen, setQuellen] = useState<WissensTreffer[]>([]);
  const [rest, setRest] = useState<number | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const live = useRef<MeisterLive | null>(null);

  useEffect(() => () => live.current?.stop(), []);

  const laeuft = status === "verbinde" || status === "hoert" || status === "spricht" || status === "denkt";

  function zeile(id: string, wer: Zeile["wer"], text: string) {
    setZeilen((alt) => {
      const i = alt.findIndex((z) => z.id === id && z.wer === wer);
      const neu = i >= 0 ? alt.map((z, j) => (j === i ? { ...z, text } : z)) : [...alt, { id, wer, text }];
      return neu.slice(-8);
    });
  }

  function starten() {
    setFehler(null);
    setQuellen([]);
    setZeilen([]);
    const m = new MeisterLive(
      {
        onStatus: setStatus,
        onMeisterText: (id, text) => zeile(id, "meister", text),
        onLehrlingText: (id, text) => zeile(id, "du", text),
        onQuellen: (treffer) =>
          setQuellen((alt) => {
            const ids = new Set(alt.map((q) => q.id));
            return [...treffer.filter((q) => !ids.has(q.id)), ...alt].slice(0, 6);
          }),
        onFehler: (code) => setFehler(/NotAllowed|Permission/i.test(code) ? t.mikro : t.fehler),
        onRestzeit: setRest,
      },
      locale,
      thema,
    );
    live.current = m;
    void m.start();
  }

  function stoppen() {
    live.current?.stop();
    setRest(null);
  }

  return (
    <section className="cc-card" style={{ borderWidth: 2 }} aria-live="polite">
      <span className="cc-kicker">{t.kicker}</span>
      <h2 style={{ margin: "0.4rem 0 0.5rem", fontSize: "1.5rem", textTransform: "uppercase" }}>{t.titel}</h2>
      <p className="cc-muted" style={{ lineHeight: 1.6, marginTop: 0 }}>{t.intro}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        {laeuft ? (
          <button type="button" className="cc-btn cc-btn--dark" onClick={stoppen}>
            {t.stop}
          </button>
        ) : (
          <button type="button" className="cc-btn cc-btn--primary" onClick={starten}>
            {t.start}
          </button>
        )}
        <span className="cc-badge">
          <span className={`cc-status-dot${laeuft ? " cc-status-dot--on" : ""}`} /> {t.status[status]}
        </span>
        {laeuft && rest !== null ? (
          <span className="cc-muted cc-mono" style={{ fontSize: "0.85rem" }}>
            {t.rest} {mmss(rest)}
          </span>
        ) : null}
      </div>

      {fehler ? (
        <p role="alert" style={{ color: "var(--cc-bad)", marginBottom: 0 }}>
          {fehler}
        </p>
      ) : null}

      {zeilen.length > 0 ? (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
          {zeilen.map((z) => (
            <p key={`${z.wer}-${z.id}`} style={{ margin: 0, lineHeight: 1.5 }}>
              <strong>{z.wer === "du" ? t.du : t.meister}:</strong> {z.text}
            </p>
          ))}
        </div>
      ) : null}

      {quellen.length > 0 ? (
        <div style={{ marginTop: "1.25rem" }}>
          <span className="cc-kicker">{t.quellen}</span>
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
            {quellen.map((q) => (
              <div key={q.id} className="cc-card cc-card--gray cc-card--flat" style={{ padding: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  {q.amtlich ? <span className="cc-badge cc-badge--yellow">{t.amtlich}</span> : null}
                  {q.art === "wikipedia" ? <span className="cc-badge">{t.wikipedia}</span> : null}
                  <strong style={{ fontSize: "0.95rem" }}>{q.titel}</strong>
                </div>
                <p className="cc-muted" style={{ fontSize: "0.8rem", margin: "0.35rem 0" }}>
                  {q.quelle}
                </p>
                {q.url ? (
                  <a href={q.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem" }}>
                    {q.art === "wikipedia" ? t.oeffnenWiki : t.oeffnen}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
          <p className="cc-muted" style={{ fontSize: "0.75rem", marginBottom: 0 }}>{t.hinweis}</p>
        </div>
      ) : null}

      <div style={{ marginTop: "1rem" }}>
        <a className="cc-btn cc-btn--sm" href={BIC_LEHRBERUF_URL} target="_blank" rel="noopener noreferrer">
          {t.bic}
        </a>
      </div>
    </section>
  );
}
