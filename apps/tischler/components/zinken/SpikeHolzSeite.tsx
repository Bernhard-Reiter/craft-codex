"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import { detectXRSupport, type XRSupport } from "../../lib/xr/support";
import { beiSitzungsEnde } from "../../lib/xr/sitzung-ende";
import {
  MESS_DAUER_MS,
  ZIEL_HZ,
  brichMessungAb,
  neueMessung,
  starteMessung,
  type Auswertung,
  type MessZustand,
} from "../../lib/fps-messung";
import { BRETT_MM, SPIKE_FARBEN, SZENE, type HolzVariante } from "../../lib/holz-spike";
import { SpikeHolzSzene, type SpikeAnzeige, type SpikeTafelTexte } from "./SpikeHolzSzene";

interface Ergebnis {
  a: Auswertung;
  variante: HolzVariante;
  modus: "ar" | "vr" | null;
}

/**
 * P6-Spike »Holz auf der Quest« — Messseite für die Quest 3, kein Lehrinhalt.
 * Ein Brett, zwei Oberflächen (Shader / gebackene Textur = Plan B), Messung der
 * Bildrate über 60 s mit Anzeige in der Szene und auf der Seite.
 * XR-Einstieg wie /zinken/xr: createXRStore ohne Emulator und ohne offerSession,
 * Start per Knopf, Sitzungsende setzt zurück.
 */
export function SpikeHolzSeite() {
  const t = useTranslations("zinken.spikeHolz");
  const sprache = useLocale() === "en" ? "en-GB" : "de-AT";
  const zahl = (n: number, stellen = 1) =>
    n.toLocaleString(sprache, { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

  const store = useMemo(() => createXRStore({ emulate: false, offerSession: false }), []);
  const [messung] = useState(() => neueMessung());
  const [support, setSupport] = useState<XRSupport | null>(null);
  const [modus, setModus] = useState<"ar" | "vr" | null>(null);
  const [sitzungHz, setSitzungHz] = useState<number | null>(null);
  const [variante, setVariante] = useState<HolzVariante>("shader");
  const [zustand, setZustand] = useState<MessZustand>("bereit");
  const [jetztFps, setJetztFps] = useState<number | null>(null);
  const [sekunden, setSekunden] = useState(0);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);

  useEffect(() => {
    let weg = false;
    detectXRSupport().then((r) => !weg && setSupport(r));
    // Sitzungsende: Modus zurück, eine laufende Messung zählt nicht (sonst mischt
    // sie Brillen- und Bildschirm-Frames).
    const ab = beiSitzungsEnde(store, () => {
      setModus(null);
      brichMessungAb(messung);
      setZustand(messung.zustand);
    });
    const abHz = store.subscribe((s) => setSitzungHz(s.frameRate ?? null));
    return () => {
      weg = true;
      ab();
      abHz();
    };
  }, [store, messung]);

  const starteXR = async (art: "ar" | "vr") => {
    brichMessungAb(messung);
    setZustand(messung.zustand);
    try {
      const s = art === "ar" ? await store.enterAR() : await store.enterVR();
      if (s) setModus(art);
    } catch (e) {
      console.error("[XR] Start fehlgeschlagen:", e);
    }
  };

  const messungStarten = useCallback(() => {
    starteMessung(messung);
    setZustand(messung.zustand);
    setSekunden(0);
    setErgebnis(null);
  }, [messung]);

  const wechseln = useCallback(() => {
    if (messung.zustand === "laeuft") return;
    setVariante((v) => (v === "shader" ? "textur" : "shader"));
  }, [messung]);

  const onAnzeige = useCallback(
    (a: SpikeAnzeige) => {
      setJetztFps(a.jetztFps);
      setSekunden(a.sekunden);
      setZustand(a.zustand);
      if (a.auswertung) setErgebnis({ a: a.auswertung, variante, modus });
    },
    [variante, modus],
  );

  const name = (v: HolzVariante) => t(v === "shader" ? "shader" : "textur");
  const gesamtS = MESS_DAUER_MS / 1000;
  const messText =
    zustand === "laeuft"
      ? t("laeuft", { s: Math.floor(sekunden), gesamt: gesamtS })
      : zustand === "fertig"
        ? t("fertig", { gesamt: gesamtS })
        : t("bereit");
  const ergebnisText = ergebnis
    ? `${t("ergebnisFuer", { name: name(ergebnis.variante), modus: ergebnis.modus ? ergebnis.modus.toUpperCase() : t("ohneBrille") })}: ${t("ergebnis", {
        mittel: zahl(ergebnis.a.mittelFps),
        low: zahl(ergebnis.a.low1Fps),
        min: zahl(ergebnis.a.minFps),
        frames: ergebnis.a.frames.toLocaleString(sprache),
      })}`
    : undefined;
  const urteilOk = ergebnis ? ergebnis.a.urteil === "ok" : null;
  const urteilText = ergebnis
    ? ergebnis.a.urteil === "ok"
      ? t("ok", { ziel: ZIEL_HZ })
      : ergebnis.a.urteil === "nicht-ok"
        ? t("nichtOk", { ziel: ZIEL_HZ })
        : t("keineDaten")
    : undefined;

  const texte: SpikeTafelTexte = {
    titel: t("titel"),
    hinweis: t("hinweis"),
    variante: t("variante", { name: name(variante) }),
    sitzung: sitzungHz ? t("sitzungHz", { hz: zahl(sitzungHz, 0) }) : t("sitzungUnbekannt"),
    live: jetztFps === null ? t("jetztLeer") : t("jetzt", { fps: zahl(jetztFps, 0) }),
    messung: messText,
    ergebnis: ergebnisText,
    urteil: urteilText,
    start: t("start", { s: gesamtS }),
    wechseln: t("wechseln"),
  };
  const laeuft = zustand === "laeuft";

  return (
    <main className="cc-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      {/* Kicker ohne .cc-kicker: dessen ::before-Punkt ist Signalgelb (globals.css) — hier Navy aus SPIKE_FARBEN. */}
      <p style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--cc-ink-soft)" }}>
        <span aria-hidden="true" style={{ width: "0.55em", height: "0.55em", borderRadius: "50%", background: SPIKE_FARBEN.marke, flex: "none" }} />
        {t("kicker")}
      </p>
      <h1 className="cc-display" style={{ margin: "0.3rem 0 0.5rem", fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)" }}>
        {t("titel")}
      </h1>
      <p className="cc-note cc-note--official" role="note" data-testid="spike-hinweis">
        {t("hinweis")}
      </p>
      <p className="cc-lead" style={{ maxWidth: "62ch", marginTop: "0.8rem" }}>
        {t("lead", { b: BRETT_MM.breite, d: BRETT_MM.dicke, l: BRETT_MM.laenge, s: gesamtS, ziel: ZIEL_HZ })}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.9rem", alignItems: "center" }}>
        <button type="button" className="cc-btn cc-btn--dark cc-btn--sm" disabled={!support?.vr} onClick={() => starteXR("vr")}>
          {t("vr")}
        </button>
        <button type="button" className="cc-btn cc-btn--sm" disabled={!support?.ar} onClick={() => starteXR("ar")}>
          {t("ar")}
        </button>
        <button type="button" className="cc-btn cc-btn--sm" disabled={laeuft} onClick={messungStarten}>
          {texte.start}
        </button>
        <button type="button" className="cc-btn cc-btn--sm" disabled={laeuft} onClick={wechseln}>
          {texte.wechseln}
        </button>
      </div>
      {support && !support.ar && !support.vr && (
        <p className="cc-muted" style={{ fontSize: "0.85rem", marginTop: "0.6rem" }}>{t("nichtVerfuegbar")}</p>
      )}

      <div aria-live="polite" data-testid="spike-messung" style={{ marginTop: "0.8rem" }}>
        <p className="cc-muted" style={{ margin: 0 }}>{texte.variante} · {texte.sitzung} · {texte.live}</p>
        <p style={{ margin: "0.3rem 0 0" }}>{texte.messung}</p>
        {texte.ergebnis && <p style={{ margin: "0.3rem 0 0" }}>{texte.ergebnis}</p>}
        {texte.urteil && (
          <p
            style={{
              margin: "0.4rem 0 0",
              fontWeight: 700,
              color: urteilOk ? SPIKE_FARBEN.gut : SPIKE_FARBEN.schlecht,
            }}
          >
            {texte.urteil}
          </p>
        )}
      </div>

      <section
        className="cc-stage"
        aria-label={t("vorschau")}
        style={{ marginTop: "1rem", height: "60vh", minHeight: 400, borderRadius: "var(--cc-radius)", overflow: "hidden" }}
      >
        <Canvas
          // uikit braucht localClippingEnabled fürs Layout (wie /dovetail/xr). Keine Schatten.
          gl={{ localClippingEnabled: true }}
          camera={{ position: SZENE.vorschauKamera, fov: 50 }}
          onCreated={({ camera }) => camera.lookAt(...SZENE.brettPosition)}
          style={{ background: SPIKE_FARBEN.hintergrund }}
        >
          <XR store={store}>
            <SpikeHolzSzene
              variante={variante}
              messung={messung}
              laeuft={laeuft}
              urteilOk={urteilOk}
              texte={texte}
              onAnzeige={onAnzeige}
              onStart={messungStarten}
              onWechseln={wechseln}
            />
            {!modus && <OrbitControls target={SZENE.brettPosition} />}
          </XR>
        </Canvas>
      </section>
    </main>
  );
}
