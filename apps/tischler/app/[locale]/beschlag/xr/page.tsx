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
 */

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore, useXR } from "@react-three/xr";
import {
  WorkflowController,
  buildHawaCombinoLayout,
  mayRenderDrillPoints,
} from "@craft-codex/core";
import { BeschlagScene } from "../../../../components/BeschlagScene";
import { BeschlagXRTafel } from "../../../../components/BeschlagXRTafel";
import {
  BeschlagARRegistration,
  type BeschlagRegistration,
} from "../../../../components/BeschlagARRegistration";
import { HAWA_COMBINO_WORKFLOW } from "../../../../lib/beschlag/hawa-combino-workflow";
import { detectXRSupport, type XRSupport } from "../../../../lib/xr/support";
import { Link } from "../../../../i18n/navigation";

const TUER_BREITE = 600;
const TUER_HOEHE = 2000;

/** RMS-Grenze in Metern, ab der die Registrierung als grob gilt. */
const RMS_WARN_M = 0.01;

/** Startpose der schwebenden Tafel: vor dem Nutzer, auf Augenhöhe. */
const TAFEL_POS: [number, number, number] = [0, 1.25, -0.75];

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

export default function BeschlagXRPage() {
  const [support, setSupport] = useState<XRSupport | null>(null);
  const [reg, setReg] = useState<BeschlagRegistration | null>(null);
  const [ausrichten, setAusrichten] = useState(false);
  const [index, setIndex] = useState(0);

  const store = useMemo(
    () => createXRStore({ emulate: false, offerSession: false }),
    [],
  );

  const controller = useMemo(
    () => new WorkflowController(HAWA_COMBINO_WORKFLOW),
    [],
  );
  const steps = controller.getSteps();
  const schritt = steps[index];

  const layout = useMemo(() => buildHawaCombinoLayout(TUER_BREITE), []);
  const bohrpunkteFrei = mayRenderDrillPoints(layout);

  useEffect(() => {
    let cancelled = false;
    detectXRSupport().then((r) => {
      if (!cancelled) setSupport(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <main className="xrseite">
      <header className="kopf">
        <h1>Beschlagmontage in AR</h1>
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
        {support === null && <p>Prüfe WebXR-Unterstützung …</p>}
        {support && !support.ar && (
          <p className="hinweis">
            Dieses Gerät kann kein immersives AR ({support.reason ?? "immersive-ar nicht unterstützt"}).
            Am besten mit der Quest 3 über https öffnen — oder zur{" "}
            <Link href="/beschlag">Desktop-Ansicht</Link>.
          </p>
        )}
        {support?.ar && (
          <button type="button" className="arknopf" onClick={enterAR}>
            AR starten
          </button>
        )}
        <p className="zurueck">
          <Link href="/beschlag">← Desktop-Ansicht</Link>
        </p>
      </header>

      <div className="buehne" aria-hidden>
        <Canvas camera={{ position: [0, 0, 2.9], fov: 45 }}>
          <XR store={store}>
            <SessionWatcher onEnded={() => setReg(null)} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[1, 2, 3]} intensity={1.0} />

            {/* ─── Schwebende Menütafel (visionOS-Fenster, apfel-kit) ─── */}
            <BeschlagXRTafel
              schritt={schritt}
              index={index}
              gesamt={steps.length}
              ausrichten={ausrichten}
              rmsMm={rmsMm}
              rmsGrob={rmsGrob}
              onZurueck={() => setIndex((i) => Math.max(0, i - 1))}
              onWeiter={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
              onAusrichtenStart={verwerfen}
              onAusrichtenAbbruch={() => setAusrichten(false)}
              position={TAFEL_POS}
            />

            {ausrichten && (
              <BeschlagARRegistration
                faceWidthMm={TUER_BREITE}
                faceHeightMm={TUER_HOEHE}
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
                  faceHeight={TUER_HOEHE}
                  activeStepId={schritt?.id}
                />
              </group>
            )}
          </XR>
        </Canvas>
      </div>

      <style jsx>{`
        .xrseite {
          max-width: 68rem;
          margin: 0 auto;
          padding: 2rem 1.5rem 3rem;
        }
        .kopf h1 {
          margin: 0 0 0.3rem;
          font-size: 1.5rem;
        }
        .kopf p {
          margin: 0 0 0.6rem;
          font-size: 0.9rem;
          opacity: 0.75;
        }
        .bedienung {
          opacity: 0.9;
        }
        .hinweis {
          border-left: 3px solid #8a6a1f;
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
    </main>
  );
}
