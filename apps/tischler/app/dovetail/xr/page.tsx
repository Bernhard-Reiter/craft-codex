"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import {
  DEFAULT_DOVETAIL_PARAMS,
  type DovetailParams,
  type DovetailStep,
} from "@craft-codex/core";
import { DovetailSceneContents } from "../../../components/DovetailScene";
import { XRStepBar } from "../../../components/XRStepBar";
import { XRPlacement } from "../../../components/XRPlacement";
import { XRVoicePanel } from "../../../components/XRVoicePanel";
import { XRAnreissFlow } from "../../../components/XRAnreissFlow";
import { XRDraggablePanel } from "../../../components/XRDraggablePanel";
import { XRNavBar } from "../../../components/XRNavBar";
import { WerkzeugAmBrett } from "../../../components/WerkzeugAmBrett";
import { SiteFooter } from "../../../components/SiteFooter";
import {
  buildAnreissFlow,
  istLinieSichtbar,
} from "../../../lib/zinken/anreiss-flow";
import { detectXRSupport, type XRSupport } from "../../../lib/xr/support";
import { loadSession, saveSession } from "../../../lib/storage/local";
import {
  useBoardPlacement,
  usePersistentPose,
} from "../../../lib/xr/use-board-placement";
import { LocalRAGProvider } from "../../../lib/rag/local-rag";
import { KeywordTopicGuard } from "../../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../../lib/rag/corpus";
import { useServerVoice } from "../../../lib/voice/use-server-voice";

// Menue-Panel-Startpose: rechts neben dem Brett, auf Arbeitshoehe vor dem User.
const MENU_DEFAULT: [number, number, number] = [0.55, 1.15, -0.6];

export default function DovetailXRPage() {
  const [support, setSupport] = useState<XRSupport | null>(null);
  const [params, setParams] = useState<DovetailParams>(DEFAULT_DOVETAIL_PARAMS);
  const [step, setStep] = useState<DovetailStep>("anreissen");
  const placement = useBoardPlacement();
  // Menue-Panel: eigene, vom Brett ENTKOPPELTE Pose → verschwindet nicht, wenn
  // das Brett bewegt wird. Default rechts vor dem User, auf Arbeitshoehe.
  const menuPose = usePersistentPose("xr-menu", MENU_DEFAULT);
  const previewControls = useRef<{ reset: () => void } | null>(null);

  // Brett, Menue UND Vorschau-Ansicht zuruecksetzen — fuer den Fall, dass eine
  // alte, weggeschobene Pose aus localStorage etwas aus dem Blick raeumt.
  const zentrieren = () => {
    placement.reset();
    menuPose.reset();
    previewControls.current?.reset();
  };

  // Gefuehrtes Anreissen im XR: 7 Sub-Schritte mit 3D-Tafel + progressiven
  // Linien + Werkzeugen. Default an; ueber "Hand-Schritte" auf die generische
  // 5-Schritt-Leiste umschaltbar.
  const [anreissModus, setAnreissModus] = useState(true);
  const [anreissIndex, setAnreissIndex] = useState(0);
  const anreissFlow = useMemo(
    () => buildAnreissFlow(params.width_mm, params.thickness_mm),
    [params.width_mm, params.thickness_mm],
  );
  const anreissSchritt =
    anreissFlow.schritte[
      Math.min(anreissIndex, anreissFlow.schritte.length - 1)
    ]!;
  // Im Anreiss-Modus zeigt das Hologramm die berechnete Lehrbuch-Teilung.
  const xrParams: DovetailParams = useMemo(
    () =>
      anreissModus
        ? { ...params, pinCount: anreissFlow.layout.AZS, ratio: anreissFlow.layout.slopeRatio }
        : params,
    [anreissModus, params, anreissFlow.layout.AZS, anreissFlow.layout.slopeRatio],
  );
  const anreissFilter = useMemo(
    () => (id: string) => istLinieSichtbar(anreissSchritt, id),
    [anreissSchritt],
  );

  // Voice-Coach: gleicher RAG + TopicGuard + Stimm-Kette wie /dovetail.
  // Ohne Server/Cache bleibt tts undefined → Text-Antwort, Demo laeuft weiter.
  const { rag, guard } = useMemo(() => {
    const r = new LocalRAGProvider(getDemoCorpus());
    const g = new KeywordTopicGuard({
      rag: r,
      onTopicMin: 0.25,
      offTopicMax: 0.05,
      blacklist: ["bitcoin", "krypto", "trading"],
    });
    return { rag: r, guard: g };
  }, []);
  const { bundle: voiceBundle } = useServerVoice(rag, guard);

  const store = useMemo(
    () =>
      createXRStore({
        emulate: false,
        // AR-Modus auf Quest 3 / Galaxy XR braucht Floor-Reference + DOM-Overlay
        offerSession: false,
      }),
    [],
  );

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setParams(saved.params);
      // XR kennt keinen "Überblick"-Schritt (Schritt 0 ist 2D-Erklärung) —
      // ein wiederhergestellter Überblick wird auf den ersten Handschritt
      // gemappt, sonst bliebe in XR kein Tab aktiv.
      setStep(saved.step === "ueberblick" ? "anreissen" : saved.step);
    }
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
      const session = await store.enterAR();
      if (!session) {
        console.warn(
          "[XR] enterAR returned no session — denied or unsupported",
        );
      }
    } catch (e) {
      console.error("[XR] enterAR failed:", e);
    }
  };

  const enterVR = async () => {
    try {
      const session = await store.enterVR();
      if (!session) {
        console.warn(
          "[XR] enterVR returned no session — denied or unsupported",
        );
      }
    } catch (e) {
      console.error("[XR] enterVR failed:", e);
    }
  };

  return (
    <>
      <main className="cc-page" style={{ maxWidth: 960 }}>
        <p className="cc-kicker">Werkstück 03</p>
        <h1
          style={{
            margin: "0.5rem 0 0.75rem",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            textTransform: "uppercase",
          }}
        >
          Schwalbenschwanz als <span className="cc-mark">Hologramm</span>
        </h1>
        <p className="cc-muted" style={{ lineHeight: 1.6, margin: 0 }}>
          Dieselbe 3D-Szene wie in der Werkstatt, jetzt als echte WebXR-Session.
          „Enter AR“ auf einer Quest 3 oder Galaxy XR (oder Chrome mit
          WebXR-Emulator) — das Brett erscheint auf Tischhöhe in deinem Raum.
        </p>

        {support === null && (
          <p className="cc-muted" style={{ marginTop: "1.5rem" }}>
            Prüfe XR-Support …
          </p>
        )}

        {support && (
          <section className="cc-card" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Capability label="Immersive AR" supported={support.ar} />
              <Capability label="Immersive VR" supported={support.vr} />
            </div>
            {support.reason && (
              <p
                className="cc-muted"
                style={{ marginTop: "1rem", fontSize: "0.85rem" }}
              >
                <strong>Grund:</strong> {support.reason}
              </p>
            )}

            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={!support.ar}
                onClick={enterAR}
                className="cc-btn cc-btn--primary"
              >
                Enter AR
              </button>
              <button
                type="button"
                disabled={!support.vr}
                onClick={enterVR}
                className="cc-btn cc-btn--primary"
              >
                Enter VR
              </button>
            </div>

            {!support.ar && !support.vr && (
              <FallbackMessage reason={support.reason} />
            )}
          </section>
        )}

        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className={anreissModus ? "cc-btn cc-btn--primary cc-btn--sm" : "cc-btn cc-btn--sm"}
            onClick={() => setAnreissModus(true)}
          >
            Geführtes Anreißen
          </button>
          <button
            type="button"
            className={!anreissModus ? "cc-btn cc-btn--primary cc-btn--sm" : "cc-btn cc-btn--sm"}
            onClick={() => setAnreissModus(false)}
          >
            Hand-Schritte
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--sm"
            onClick={zentrieren}
            style={{ marginLeft: "auto" }}
            title="Brett und Ansicht zurueck ins Zentrum"
          >
            🎯 Brett zentrieren
          </button>
          {anreissModus && (
            <span className="cc-muted" style={{ fontSize: "0.8rem" }}>
              Schritt {anreissIndex + 1}/{anreissFlow.schritte.length} —{" "}
              {anreissSchritt.label} · {anreissFlow.layout.AZS} Schwalben
            </span>
          )}
        </div>

        <section
          className="cc-stage"
          style={{ marginTop: "0.75rem", height: "60vh", minHeight: 400 }}
        >
          <Canvas
            shadows
            // uikit (apfel-Panels) braucht localClippingEnabled fuers Layout.
            gl={{ localClippingEnabled: true }}
            // 2D-Vorschau: Kamera auf das Brett richten (Default-Pose 1.2m hoch,
            // 0.6m vor dem User). In der echten XR-Session uebernimmt das Headset
            // die Kamera — Position hier betrifft NUR die Vorschau.
            camera={{ position: [0.8, 1.7, 0.9], fov: 45 }}
            onCreated={({ camera }) => {
              camera.lookAt(0, 1.2, -0.6);
            }}
            style={{ background: "#0a0a0a" }}
          >
            <XR store={store}>
              {/* In AR/VR steht der User am Welt-Origin (Boden). Der Brett-Stack
                  startet auf Arbeitshoehe vor dem Lehrling und ist per Ziehgriff
                  + Buttons frei platzierbar; die Pose ueberlebt einen Reload. */}
              <XRPlacement
                position={placement.position}
                onDragMove={placement.moveTo}
                onDragEnd={placement.commit}
                onHeight={placement.nudgeHeight}
                onDepth={placement.nudgeDepth}
                onReset={placement.reset}
                contentScale={3}
                overlay={
                  anreissModus ? null : (
                    <>
                      <XRStepBar
                        active={step}
                        onChange={(s) => {
                          setStep(s);
                          saveSession({ params, step: s, updatedAt: Date.now() });
                        }}
                      />
                      <XRVoicePanel
                        step={step}
                        rag={rag}
                        guard={guard}
                        tts={voiceBundle?.tts}
                      />
                    </>
                  )
                }
              >
                <DovetailSceneContents
                  params={xrParams}
                  step={anreissModus ? "anreissen" : step}
                  withOrbitControls={false}
                  markingStyle="tube"
                  markingFilter={anreissModus ? anreissFilter : undefined}
                />
                {anreissModus && (
                  <WerkzeugAmBrett
                    phase={anreissSchritt.id}
                    params={xrParams}
                    layout={anreissFlow.layout}
                  />
                )}
              </XRPlacement>

              {/* Anreiss-Menue als eigenes, vom Brett ENTKOPPELTES, verschiebbares
                  Quest-Panel — bleibt sichtbar, auch wenn das Brett bewegt wird. */}
              {anreissModus && (
                <XRDraggablePanel
                  position={menuPose.position}
                  onDragMove={menuPose.moveTo}
                  onDragEnd={menuPose.commit}
                  width={0.56}
                  height={0.5}
                  title="Anreissen"
                  bare
                >
                  <XRAnreissFlow
                    flow={anreissFlow}
                    index={anreissIndex}
                    onIndex={setAnreissIndex}
                  />
                </XRDraggablePanel>
              )}

              {/* Navigations-Dock (Quest-Standard, apfel TabBar) — immer
                  sichtbar vor dem User, vom Brett entkoppelt. */}
              <XRNavBar
                anreissModus={anreissModus}
                onModus={setAnreissModus}
                onZentrieren={zentrieren}
                position={[0, 0.72, -0.62]}
              />
            </XR>
            {/* Vorschau-Navigation (nur am Screen; in der AR-Session steuert das
                Headset die Kamera). Pan AUS + Blick aufs Brett = nie "verloren". */}
            <OrbitControls
              ref={previewControls as never}
              target={[0, 1.2, -0.6]}
              enablePan={false}
              enableZoom
              minDistance={0.5}
              maxDistance={5}
            />
          </Canvas>
        </section>
        <div
          className="cc-card cc-card--gray cc-card--flat cc-muted"
          style={{ marginTop: "0.75rem", padding: "0.6rem 0.9rem", fontSize: "0.78rem" }}
        >
          Vorschau zeigt aktuellen Lernschritt: <strong>{step}</strong> · Brett{" "}
          {params.width_mm}×{params.length_mm}mm, {params.pinCount} Pins, 1:
          {params.ratio}. Änderbar in der{" "}
          <Link href="/dovetail" style={{ borderBottom: "2px solid var(--cc-yellow)" }}>
            Werkstatt
          </Link>{" "}
          (State geteilt via localStorage).
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Capability({
  label,
  supported,
}: {
  label: string;
  supported: boolean;
}) {
  return (
    <div
      className={supported ? "cc-badge cc-badge--yellow" : "cc-badge"}
      style={{ fontSize: "0.72rem", padding: "0.4rem 0.7rem" }}
    >
      {label}: {supported ? "bereit" : "nicht verfügbar"}
    </div>
  );
}

function FallbackMessage({ reason }: { reason?: string }) {
  return (
    <div
      className="cc-card cc-card--gray cc-card--flat"
      style={{ marginTop: "1rem", fontSize: "0.9rem", lineHeight: 1.5 }}
    >
      <strong>Kein XR-Gerät verfügbar.</strong>
      <p className="cc-muted" style={{ margin: "0.5rem 0 0" }}>
        Du kannst die Demo trotzdem in 3D nutzen — in der{" "}
        <Link
          href="/dovetail"
          style={{ borderBottom: "2px solid var(--cc-yellow)", fontWeight: 600 }}
        >
          Werkstatt
        </Link>
        . Für XR brauchst du Galaxy XR, Quest 3 oder Chrome mit WebXR-Emulator
        (chrome://flags/#webxr-incubations).
      </p>
      {reason && (
        <p className="cc-muted" style={{ margin: "0.5rem 0 0", fontSize: "0.8rem" }}>
          Detail: {reason}
        </p>
      )}
    </div>
  );
}
