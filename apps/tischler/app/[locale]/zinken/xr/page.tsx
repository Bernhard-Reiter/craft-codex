"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import { zinkenTeilung } from "@craft-codex/core";
import { Link } from "../../../../i18n/navigation";
import { SiteFooter } from "../../../../components/SiteFooter";
import { detectXRSupport, type XRSupport } from "../../../../lib/xr/support";
import { beiSitzungsEnde } from "../../../../lib/xr/sitzung-ende";
import { getLehrgang } from "../../../../lib/zinken/lehrgang-index";
import { Abspieler, ZinkenWerkstueckInhalt } from "../../../../components/zinken/ZinkenWerkstueck3D";
import { XRHobelbank, ZANGE_POSITION } from "../../../../components/zinken/XRHobelbank";
import { ZinkenXRTafel } from "../../../../components/zinken/ZinkenXRTafel";
import { XRMovable } from "../../../../components/XRMovable";
import {
  XRDreiPunktRegistrierung,
  type DreiPunktErgebnis,
} from "../../../../components/zinken/XRDreiPunktRegistrierung";
import { bewerteRegistrierung, zinkenModellPunkte } from "../../../../lib/zinken/xr-registrierung";
import { xrMasseAusSuche, type XRMasse } from "../../../../lib/zinken/xr-masse";
import { arOverlayPose } from "../../../../lib/zinken/xr-pose";

/** Vor der Registrierung: Werkstück schwebt auf Arbeitshöhe vor dem Lehrling. */
const AR_PLATZHALTER: [number, number, number] = [0, 1.0, -0.45];

/**
 * Zinken-Lehrgang in AR/VR — erste lauffähige Fassung (ohne Brillentest).
 * AR: Anriss, Sägefugen mit Abfallseite und Stemm-Zonen über dem ECHTEN
 *     Brett, ausgerichtet per 3-Punkt-Registrierung. Regel: mit Brille nur
 *     anreißen und prüfen, sägen/stemmen ohne Brille.
 * VR: dasselbe Werkstück an einer virtuellen Hobelbank, Vormachen in
 *     Zeitlupe aus Sicht des Lehrlings.
 */
export default function ZinkenXRPage() {
  const t = useTranslations("zinken");
  const appLocale: "de" | "en" = useLocale() === "en" ? "en" : "de";
  const lehrgang = getLehrgang(appLocale);
  // Maße aus dem Rechner (?b=&d=…), sonst Buchbeispiel 140 × 20 — immer sichtbar angezeigt.
  const [masse, setMasse] = useState<XRMasse>(() => xrMasseAusSuche(""));
  useEffect(() => {
    setMasse(xrMasseAusSuche(window.location.search));
  }, []);
  const teilung = useMemo(
    () => zinkenTeilung(masse.B, masse.D, { dichte: masse.dichte, azs: masse.azs }),
    [masse],
  );
  const modellPunkte = useMemo(() => zinkenModellPunkte(teilung.layout.B, teilung.layout.D), [teilung]);

  const [support, setSupport] = useState<XRSupport | null>(null);
  const [modus, setModus] = useState<"ar" | "vr" | null>(null);
  // AR beginnt beim Anzeichnen (Kapitel 2) — Index aus den Daten, kein fester Wert.
  const [index, setIndex] = useState(() => Math.max(0, lehrgang.findIndex((s) => s.id === "anzeichnen")));
  const [fortschritt, setFortschritt] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const [registrierung, setRegistrierung] = useState<DreiPunktErgebnis | null>(null);
  const [richteAus, setRichteAus] = useState(false);
  const [ungueltig, setUngueltig] = useState(false);

  const store = useMemo(() => createXRStore({ emulate: false, offerSession: false }), []);

  useEffect(() => {
    let weg = false;
    detectXRSupport().then((r) => !weg && setSupport(r));
    // Sitzungsende: alles zurück, was am Raum der alten Sitzung hing. Eine
    // alte Pose stünde sonst in der neuen Sitzung als »ausgerichtet … gut« da.
    const ab = beiSitzungsEnde(store, () => {
      setModus(null);
      setRegistrierung(null);
      setRichteAus(false);
      setUngueltig(false);
    });
    return () => {
      weg = true;
      ab();
    };
  }, [store]);

  const schritt = lehrgang[index] ?? lehrgang[0]!;
  // Animation nur, wo der Eintrag einen Arbeitsgang hat (sägen, stemmen, passen).
  const mitAnimation = schritt.szene.arbeitsgang !== undefined;

  const geheZu = (i: number) => {
    setIndex(Math.max(0, Math.min(lehrgang.length - 1, i)));
    setFortschritt(0);
    setLaeuft(false);
  };

  const starte = async (art: "ar" | "vr") => {
    try {
      const s = art === "ar" ? await store.enterAR() : await store.enterVR();
      if (s) setModus(art);
    } catch (e) {
      console.error("[XR] Start fehlgeschlagen:", e);
    }
  };

  const onRegistriert = useCallback((r: DreiPunktErgebnis) => {
    setRegistrierung(r);
    setRichteAus(false);
    setUngueltig(false);
  }, []);
  // Ungültig oder neu ausrichten: die alte Pose gilt nicht mehr.
  const onUngueltig = useCallback(() => {
    setRegistrierung(null);
    setUngueltig(true);
  }, []);

  const guete = registrierung ? bewerteRegistrierung(registrierung.rmsError) : null;
  const zahl = (n: number) =>
    n.toLocaleString(appLocale === "en" ? "en-GB" : "de-AT", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  const status =
    modus === "vr"
      ? t("xr.vrStatus")
      : ungueltig
        ? t("xr.ungueltig")
        : registrierung && guete
          ? `${t("xr.ausgerichtet", { mm: zahl(registrierung.rmsError * 1000), guete: t(`xr.${guete}`) })} · ${t("xr.pruefen")}`
          : t("xr.nichtAusgerichtet");

  const mm = (n: number) => n.toLocaleString(appLocale === "en" ? "en-GB" : "de-AT", { maximumFractionDigits: 1 });
  const masseText = t(masse.buch ? "xr.masseBuch" : "xr.masseEigen", { b: mm(masse.B), d: mm(masse.D) });

  const tafelTexte = {
    titel: `${t("nav.schritt", { nr: schritt.nr })}: ${schritt.titel} · ${masseText}`,
    zeilen: [...schritt.nachmachen.map((n, i) => `${i + 1}. ${n.kurz}`), `✓ ${schritt.kontrollpunkt[0] ?? ""}`],
    status,
    sicherheit: t("hero.sicherheit"),
    zurueck: t("nav.zurueck"),
    weiter: t("nav.weiter"),
    abspielen: t("buehne.abspielen"),
    pause: t("buehne.pause"),
    ausrichten: modus === "ar" ? t("xr.ausrichten") : undefined,
  };

  // Werkstück-Pose: AR → registriert, nur bei Güte gut/grenzwertig (sonst Platzhalter);
  // VR/Vorschau → in der Zange.
  const inAR = modus === "ar";
  const pose = arOverlayPose(inAR, registrierung);
  const werkstueckPos: [number, number, number] = pose?.position ?? (inAR ? AR_PLATZHALTER : ZANGE_POSITION);
  const werkstueckQuat: [number, number, number, number] = pose?.quaternion ?? [0, 0, 0, 1];

  return (
    <>
      <main className="cc-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
        <p className="cc-kicker">{t("hero.kicker")}</p>
        <h1 className="cc-display" style={{ margin: "0.3rem 0 0.5rem", fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)" }}>{t("xr.title")}</h1>
        <p className="cc-lead" style={{ maxWidth: "62ch" }}>{t("xr.lead")}</p>
        <p className="cc-muted" data-testid="xr-masse" style={{ marginTop: "0.4rem" }}>{masseText}</p>
        <p className="cc-note" role="note" style={{ marginTop: "0.8rem" }} data-testid="ar-regel">{t("hero.sicherheit")}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.9rem", alignItems: "center" }}>
          <button type="button" className="cc-btn cc-btn--primary cc-btn--sm" disabled={!support?.ar} onClick={() => starte("ar")}>{t("xr.ar")}</button>
          <button type="button" className="cc-btn cc-btn--sm" disabled={!support?.vr} onClick={() => starte("vr")}>{t("xr.vr")}</button>
          <Link href="/zinken" className="cc-btn cc-btn--sm">{t("xr.zurueckLehrgang")}</Link>
        </div>
        {support && !support.ar && !support.vr && (
          <p className="cc-muted" style={{ fontSize: "0.85rem", marginTop: "0.6rem" }}>{t("xr.nichtVerfuegbar")}</p>
        )}

        <nav aria-label={t("nav.label")} className="cc-tabbar" style={{ flexWrap: "wrap", margin: "1rem 0 0.6rem" }}>
          {lehrgang.map((s, i) => (
            <button key={s.id} type="button" className="cc-tab" aria-pressed={i === index} onClick={() => geheZu(i)} style={{ fontSize: "0.8rem" }}>
              <span className="cc-tab-step">{s.nr}</span> {s.titel}
            </button>
          ))}
        </nav>

        <section className="cc-stage" aria-label={t("xr.vorschau")} style={{ height: "62vh", minHeight: 420, borderRadius: "var(--cc-radius)", overflow: "hidden" }}>
          <Canvas
            shadows
            gl={{ localClippingEnabled: true }}
            camera={{ position: [0.15, 1.45, 0.35], fov: 50 }}
            onCreated={({ camera }) => camera.lookAt(-0.2, 0.95, -0.4)}
            style={{ background: "#101010" }}
          >
            <XR store={store}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[0.5, 2, 1]} intensity={1.1} castShadow />

              {!inAR && <XRHobelbank />}

              <group position={werkstueckPos} quaternion={werkstueckQuat}>
                <ZinkenWerkstueckInhalt
                  teilung={teilung}
                  phase={schritt.id}
                  fortschritt={mitAnimation ? fortschritt : 1}
                  darstellung={inAR ? "anriss" : "voll"}
                  linienBreite={inAR ? 3 : 1.5}
                />
              </group>
              <Abspieler
                laeuft={mitAnimation && laeuft}
                tempo={0.35}
                dauerS={schritt.id === "passen" ? 6 : 16}
                fortschritt={fortschritt}
                onFortschritt={(f) => {
                  setFortschritt(f);
                  if (f >= 1) setLaeuft(false);
                }}
              />

              {inAR && richteAus && (
                <XRDreiPunktRegistrierung
                  modell={modellPunkte}
                  anweisungen={[t("xr.p1"), t("xr.p2"), t("xr.p3")]}
                  ohneController={t("xr.ohneController")}
                  onRegistriert={onRegistriert}
                  onUngueltig={onUngueltig}
                />
              )}

              <XRMovable position={[0.3, 1.35, -0.7]}>
                <ZinkenXRTafel
                  position={[0, 0, 0]}
                  texte={tafelTexte}
                  laeuft={laeuft}
                  kannZurueck={index > 0}
                  kannWeiter={index < lehrgang.length - 1}
                  mitAnimation={mitAnimation}
                  onZurueck={() => geheZu(index - 1)}
                  onWeiter={() => geheZu(index + 1)}
                  onAbspielen={() => {
                    if (fortschritt >= 1) setFortschritt(0);
                    setLaeuft((l) => !l);
                  }}
                  onAusrichten={inAR ? () => { setRegistrierung(null); setRichteAus(true); setUngueltig(false); } : undefined}
                />
              </XRMovable>

              {!modus && <OrbitControls target={[-0.2, 0.95, -0.4]} />}
            </XR>
          </Canvas>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
