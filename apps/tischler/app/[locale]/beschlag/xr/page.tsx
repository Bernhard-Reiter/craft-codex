"use client";

/**
 * Beschlagmontage in AR — Quest-3-Passthrough mit 3-Punkt-Registrierung.
 *
 * Bedienkonzept (nach erstem Quest-Test, 27.08.):
 * - Die Menütafel SCHWEBT immer aufrecht vor dem Nutzer (Billboard) und ist
 *   von Sitzungsbeginn an bedienbar — sie hängt bewusst NICHT am registrierten
 *   Türblatt: liegt das Werkstück waagrecht auf der Bank, läge eine dort
 *   verankerte Tafel flach und unlesbar mit drauf.
 * - TRIGGER bedient die Tafel. GRIFF-Taste erfasst die Ecken beim Ausrichten.
 *   Getrennte Tasten, damit ein Menü-Klick nie zugleich einen Punkt erfasst.
 * - Nach dem Ausrichten liegen die Maßketten am echten Türblatt; die Tafel
 *   bleibt schwebend.
 *
 * Sicherungen (aus dem Architektur-Review):
 * - Bohrpunkte bleiben verriegelt, solange das Bohrbild auf "entwurf" steht.
 * - RMS-Restfehler wird angezeigt; über 10 mm rot + Aufforderung neu
 *   auszurichten.
 * - Session-Ende oder Neu-ausrichten verwirft die Transformation sofort.
 *
 * Aussehen: VI4-Hülle 0.5.0 (Menüleiste + Bühne, ohne Karten), Muster etiketten/page.tsx.
 * Ohne AR (Mac, iPad) nur ein ruhiger Satz; der Technik-Grund steht im title und in der Konsole.
 */

import { useLocale } from "next-intl";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { XR, createXRStore, useXR } from "@react-three/xr";
import { Root, Container, Text } from "@react-three/uikit";
import {
  WorkflowController,
  mayRenderDrillPoints,
} from "@craft-codex/core";
import { BeschlagScene } from "../../../../components/BeschlagScene";
import {
  MesseSchrank,
  MesseSchrankNebenWerkstueck,
} from "../../../../components/MesseSchrank";
import {
  BeschlagARRegistration,
  type BeschlagRegistration,
} from "../../../../components/BeschlagARRegistration";
import { BESCHLAEGE, STANDARD_BESCHLAG } from "../../../../lib/beschlag/auswahl";
import { detectXRSupport, type XRSupport } from "../../../../lib/xr/support";
import { Link } from "../../../../i18n/navigation";
import { MESSE_SCHRITT_KEY, schrittAusSpeicher, xrRueckweg } from "../../../../components/MesseStueckliste";


type Thema = "light" | "dark" | "auto";
type Vi4 = {
  baue: (c: unknown) => Promise<unknown>;
  menue: (c: unknown) => Promise<{ stand: () => void }>;
};

// Reihenfolge zählt (gleiche precedence): Schrift direkt NACH den Tokens, Phosphor für die Symbole.
const CSS = [
  "/vi4-design/vi4-tokens.css",
  "/vi4-app/schrift.css",
  "/vi4-design/vi4-rollen.css",
  "/vi4-design/huelle.css",
  "/vendor/phosphor-light/style.css",
];

/** Ruhiger Satz ohne AR (Mac, iPad): kein Technik-Wort auf der Seite (nicht exportieren: Next-Seiten erlauben keine Zusatz-Exporte). */
const OHNE_AR_SATZ = "AR läuft auf der Quest 3 — hier die Desktop-Ansicht.";

/** Zeichen vor dem Namen weg (⭐ der Messe-Vorlage), wie beschlag/page.tsx Z.43. */
const klar = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "");

/** RMS-Grenze in Metern, ab der die Registrierung als grob gilt. */
const RMS_WARN_M = 0.01;

/** Startpose der schwebenden Tafel: vor dem Nutzer, auf Augen-/Arbeitshöhe. */
const TAFEL_POS: [number, number, number] = [0, 1.2, -0.75];

/** Meldet dem Parent, wenn die XR-Session endet (Transformation verwerfen). */
function SessionWatcher({ onEnded }: { onEnded: () => void }) {
  const session = useXR((s) => s.session);
  const [hatte, setHatte] = useState(false);
  useEffect(() => {
    if (session) setHatte(true);
    else if (hatte) {
      setHatte(false);
      onEnded();
    }
  }, [session, hatte, onEnded]);
  return null;
}

/** Ein Tafel-Knopf: uikit-Container mit Trigger-Klick. */
function TafelKnopf({
  label,
  onClick,
  disabled = false,
  ton = "gelb",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ton?: "gelb" | "dunkel";
}) {
  const bg = disabled ? "#3a3a40" : ton === "gelb" ? "#ffed00" : "#2c2c33";
  const fg = disabled ? "#9a9aa2" : ton === "gelb" ? "#14140f" : "#e8e8ea";
  return (
    <Container
      backgroundColor={bg}
      backgroundOpacity={disabled ? 0.4 : 0.95}
      borderRadius={6}
      paddingX={12}
      paddingY={7}
      onClick={disabled ? undefined : onClick}
    >
      <Text fontSize={11} color={fg}>
        {label}
      </Text>
    </Container>
  );
}

export default function BeschlagXRPage() {
  const [support, setSupport] = useState<XRSupport | null>(null);
  const [reg, setReg] = useState<BeschlagRegistration | null>(null);
  const [ausrichten, setAusrichten] = useState(false);
  const [index, setIndex] = useState(0);
  const [beschlag, setBeschlag] = useState(STANDARD_BESCHLAG);

  const store = useMemo(
    () => createXRStore({ emulate: false, offerSession: false }),
    [],
  );

  const controller = useMemo(
    () => new WorkflowController(beschlag.workflow),
    [beschlag],
  );
  const steps = controller.getSteps();
  const schritt = steps[index];

  const werkstueck = beschlag.werkstueckFuer(schritt?.id);
  const layout = werkstueck.layout;

  // Anderes Werkstück auf dem Tisch → die alte Ausrichtung gilt nicht mehr.
  useEffect(() => {
    setReg(null);
  }, [werkstueck.id]);

  const waehle = (id: string) => {
    const b = BESCHLAEGE.find((x) => x.id === id);
    if (!b) return;
    setBeschlag(b);
    setIndex(0);
    setReg(null);
  };
  // Direktlink: /beschlag/xr?vorlage=messe lädt die Vorlage gleich.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vorlage");
    if (v) waehle(v);
    // A2: Messe-AR beginnt beim Schritt, den die Montage gemerkt hat (sonst stünde immer Schritt 1 »Tür« da).
    const messe = v === "messe" ? BESCHLAEGE.find((x) => x.id === "messe") : undefined;
    if (messe) {
      let roh: string | null = null;
      try {
        roh = window.sessionStorage.getItem(MESSE_SCHRITT_KEY);
      } catch {
        roh = null;
      }
      setIndex(schrittAusSpeicher(roh, new WorkflowController(messe.workflow).getSteps().length));
    }
  }, []);
  const bohrpunkteFrei = mayRenderDrillPoints(layout);

  useEffect(() => {
    let cancelled = false;
    detectXRSupport().then((r) => {
      if (cancelled) return;
      setSupport(r);
      if (!r.ar) console.info("[XR] kein immersives AR:", r.reason ?? "immersive-ar nicht unterstützt");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── VI4-Hülle: Rahmen + Menüleiste (Muster etiketten/page.tsx) ───
  const locale = useLocale();
  const [skript, setSkript] = useState(false);
  const themaRef = useRef<Thema>("light");
  const beschlagRef = useRef(beschlag);
  beschlagRef.current = beschlag;
  const menue = useRef<{ stand: () => void } | null>(null);
  const gebaut = useRef(false);

  useEffect(() => {
    document.body.classList.add("vi4-rahmen");
    document.documentElement.dataset.theme = themaRef.current;
    return () => {
      document.body.classList.remove("vi4-rahmen", "vi4-huelle", "vi4-links-auf", "vi4-rechts-auf");
      delete document.documentElement.dataset.theme;
      document.querySelectorAll(".vi4-m-liste").forEach((el) => el.remove());
    };
  }, []);

  useEffect(() => {
    const H = (window as unknown as { VI4Huelle?: Vi4 }).VI4Huelle;
    if (!skript || !H || gebaut.current) return;
    gebaut.current = true;
    const zurueck = () => {
      window.location.href = `/${locale}${xrRueckweg(beschlagRef.current.id)}`;
    };
    void H.menue({
      ziel: "#xr-menue",
      // Platz 0 wie die Montage (beschlag/page.tsx): AR ist Montage am Schrank = »Korpus«.
      umgebung: { aktiv: "korpus", tun: () => undefined },
      name: { titel: "Montage in AR", zusatz: () => klar(beschlagRef.current.label) },
      menues: {
        datei: [{ t: "Zurück zur Montage", tun: zurueck }],
      },
      thema: {
        wahl: () => themaRef.current,
        setze: (w: Thema) => {
          themaRef.current = w;
          document.documentElement.dataset.theme = w;
        },
      },
      schliessen: { wort: "Schließen", verb: "schliessen", tun: zurueck },
    }).then((m) => {
      menue.current = m;
    });
    // Ohne Karten: huelle.js überspringt fehlende Karten-Wähler, die Schienen bleiben leer.
    void H.baue({ wurzel: "#xr-werk", buehne: "#xr-buehne", links: [], rechts: [] });
  }, [skript, locale]);

  // Vorlage gewechselt → Name in der Menüleiste nachziehen.
  useEffect(() => {
    menue.current?.stand();
  }, [beschlag]);

  const enterAR = async () => {
    try {
      // Ausrichten startet aktiv: wer AR öffnet, will zuerst ausrichten —
      // die Tafel ist trotzdem sofort bedienbar (Trigger ≠ Griff-Taste).
      setAusrichten(true);
      const session = await store.enterAR();
      if (!session) {
        console.warn("[XR] enterAR returned no session — denied or unsupported");
      }
    } catch (e) {
      console.error("[XR] enterAR failed:", e);
    }
  };

  const verwerfen = () => {
    setReg(null);
    setAusrichten(true);
  };

  const rmsMm = reg ? reg.rmsError * 1000 : null;
  const rmsGrob = rmsMm !== null && rmsMm > RMS_WARN_M * 1000;

  return (
    <>
      {CSS.map((f) => (
        <link key={f} rel="stylesheet" href={f} precedence="vi4" />
      ))}
      <Script src="/vi4-design/huelle.js" strategy="afterInteractive" onReady={() => setSkript(true)} />

      <header id="xr-menue" />

      <main id="xr-werk" className="werk">
        {/* Bühne ohne className: huelle.js setzt vi4-buehne, React darf sie nie überschreiben (R1 Tischler). */}
        <div id="xr-buehne">
          <div className="xrseite">
            <section className="kopf">
              <p className="wahl">
                {BESCHLAEGE.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={b.id === beschlag.id}
                    onClick={() => waehle(b.id)}
                  >
                    {b.label}
                  </button>
                ))}
              </p>
              <p>
                Werkstück: <strong>{werkstueck.name}</strong>
              </p>
              <p>
                {layout.article} · Anschlag {layout.anschlag} · Quelle{" "}
                {layout.source.document} S. {layout.source.page}
              </p>
              <p className="bedienung">
                Bedienung im Headset: <strong>Trigger</strong> = Menütafel ·{" "}
                <strong>Griff-Taste</strong> (seitlich) = Ecke erfassen beim
                Ausrichten.
              </p>
              {!bohrpunkteFrei && (
                <p className="hinweis">
                  Bohrbild noch nicht freigegeben — in AR erscheinen die Maßketten
                  zum Nachmessen, keine Bohrpunkte.
                </p>
              )}
              {support === null && <p>Prüfe, ob AR geht …</p>}
              {support && !support.ar && (
                <p className="hinweis" title={support.reason ?? "immersive-ar nicht unterstützt"}>
                  {OHNE_AR_SATZ}
                </p>
              )}
              {support?.ar && (
                <button type="button" className="arknopf" onClick={enterAR}>
                  AR starten
                </button>
              )}
              <p className="zurueck">
                <Link href={xrRueckweg(beschlag.id)}>← Desktop-Ansicht</Link>
              </p>
            </section>

            <div className="buehne" aria-hidden>
              <Canvas camera={{ position: [0, 0, 2.9], fov: 45 }}>
                <XR store={store}>
                  <SessionWatcher onEnded={() => setReg(null)} />
                  <ambientLight intensity={0.8} />
                  <directionalLight position={[1, 2, 3]} intensity={1.0} />

                  {/* ─── Schwebende Menütafel: immer da, immer aufrecht ─── */}
                  <Billboard position={TAFEL_POS}>
                    <Root
                      pixelSize={0.0016}
                      anchorX="center"
                      anchorY="center"
                      flexDirection="column"
                    >
                      <Container
                        backgroundColor="#14140f"
                        backgroundOpacity={0.85}
                        borderRadius={10}
                        padding={14}
                        flexDirection="column"
                        gap={8}
                        width={250}
                      >
                        <Text fontSize={9} color="#9a9aa2">
                          {`Schritt ${index + 1} von ${steps.length}`}
                        </Text>
                        <Text fontSize={14} color="#ffffff" fontWeight="bold">
                          {schritt?.label ?? ""}
                        </Text>
                        {schritt && schritt.tools.length > 0 && (
                          <Text fontSize={10} color="#ffed00">
                            {`Werkzeug: ${schritt.tools.join(" · ")}`}
                          </Text>
                        )}
                        {schritt?.instructions.map((z, i) => (
                          <Text key={i} fontSize={10} color="#e8e8ea">
                            {`${i + 1}. ${z}`}
                          </Text>
                        ))}

                        <Container flexDirection="row" gap={8} marginTop={4}>
                          <TafelKnopf
                            label="← Zurück"
                            disabled={index === 0}
                            onClick={() => setIndex((i) => Math.max(0, i - 1))}
                          />
                          <TafelKnopf
                            label="Weiter →"
                            disabled={index === steps.length - 1}
                            onClick={() =>
                              setIndex((i) => Math.min(steps.length - 1, i + 1))
                            }
                          />
                        </Container>

                        <Container flexDirection="row" gap={8}>
                          {ausrichten ? (
                            <TafelKnopf
                              label="Ausrichten abbrechen"
                              ton="dunkel"
                              onClick={() => setAusrichten(false)}
                            />
                          ) : (
                            <TafelKnopf
                              label={reg ? "Neu ausrichten" : "Werkstück ausrichten"}
                              onClick={verwerfen}
                            />
                          )}
                        </Container>

                        {ausrichten && (
                          <Text fontSize={9} color="#ffed00">
                            Ausrichten läuft: Kreuz auf die Ecke, GRIFF-Taste drücken
                          </Text>
                        )}
                        <Text fontSize={9} color={reg ? (rmsGrob ? "#ff6b5e" : "#4ade80") : "#9a9aa2"}>
                          {reg
                            ? rmsGrob
                              ? `Ausrichtung grob: ±${rmsMm!.toFixed(1)} mm — bitte neu ausrichten`
                              : `Ausgerichtet: ±${rmsMm!.toFixed(1)} mm · Werkstück nicht bewegen`
                            : `Noch nicht ausgerichtet — ${werkstueck.name} auflegen und ausrichten`}
                        </Text>
                      </Container>
                    </Root>
                  </Billboard>

                  {ausrichten && (
                    <BeschlagARRegistration
                      faceWidthMm={werkstueck.breiteMm}
                      faceHeightMm={werkstueck.hoeheMm}
                      onRegistered={(r) => {
                        setReg(r);
                        setAusrichten(false);
                      }}
                    />
                  )}

                  {/* ─── Maßketten am registrierten Türblatt ─── */}
                  {reg && !ausrichten && (
                    <group position={reg.position} quaternion={reg.quaternion}>
                      <BeschlagScene
                        layout={layout}
                        faceHeight={werkstueck.hoeheMm}
                        activeStepId={schritt?.id}
                      />
                      {beschlag.id === "messe" && (
                        <MesseSchrankNebenWerkstueck
                          werkstueckBreiteMm={werkstueck.breiteMm}
                          activeStepId={schritt?.id}
                        />
                      )}
                    </group>
                  )}

                  {/* ─── Messe-Unterschrank frei am Boden, solange nicht ausgerichtet ─── */}
                  {beschlag.id === "messe" && !reg && !ausrichten && (
                    <group position={[0.9, 0, -1.2]} rotation={[0, -0.4, 0]}>
                      <MesseSchrank activeStepId={schritt?.id} />
                    </group>
                  )}
                </XR>
              </Canvas>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .werk {
          flex: 1 1 auto;
        }
        #xr-buehne {
          overflow: auto;
        }
        .xrseite {
          max-width: 68rem;
          margin: 0 auto;
          padding: var(--vi4-space-16) var(--vi4-space-24) var(--vi4-space-48);
          color: var(--vi4-ink);
        }
        .kopf p {
          margin: 0 0 0.6rem;
          font-size: 0.9rem;
          opacity: 0.75;
        }
        .bedienung {
          opacity: 0.9;
        }
        .wahl {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .wahl button {
          padding: 0.4rem 0.8rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          opacity: 0.6;
        }
        .wahl button[aria-pressed="true"] {
          opacity: 1;
          font-weight: 600;
        }
        .hinweis {
          border-left: 3px solid var(--vi4-muted);
          padding-left: 0.7rem;
          opacity: 0.9;
        }
        .arknopf {
          font-size: 1.05rem;
          padding: 0.7rem 1.6rem;
          cursor: pointer;
          margin: 0.4rem 0 0.8rem;
        }
        .zurueck {
          font-size: 0.85rem;
        }
        .buehne {
          height: 46vh;
          min-height: 320px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 3px;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
