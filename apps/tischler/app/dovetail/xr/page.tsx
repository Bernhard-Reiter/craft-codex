"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import {
  DEFAULT_DOVETAIL_PARAMS,
  type DovetailParams,
  type DovetailStep,
} from "@craft-codex/core";
import { DovetailSceneContents } from "../../../components/DovetailScene";
import { XRStepBar } from "../../../components/XRStepBar";
import { SiteFooter } from "../../../components/SiteFooter";
import { detectXRSupport, type XRSupport } from "../../../lib/xr/support";
import { loadSession, saveSession } from "../../../lib/storage/local";

export default function DovetailXRPage() {
  const [support, setSupport] = useState<XRSupport | null>(null);
  const [params, setParams] = useState<DovetailParams>(DEFAULT_DOVETAIL_PARAMS);
  const [step, setStep] = useState<DovetailStep>("anreissen");

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
      setStep(saved.step);
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

        <section
          className="cc-stage"
          style={{ marginTop: "1.5rem", height: "60vh", minHeight: 400 }}
        >
          <Canvas
            shadows
            // 2D-Vorschau: Kamera auf die Bretter richten (liegen auf 1.2m
            // fuer den XR-Modus). In der echten XR-Session uebernimmt das
            // Headset die Kamera — Position hier betrifft NUR die Vorschau.
            camera={{ position: [0.9, 1.9, 1.0], fov: 45 }}
            onCreated={({ camera }) => {
              camera.lookAt(0, 1.4, -0.6);
            }}
            style={{ background: "#0a0a0a" }}
          >
            <XR store={store}>
              {/* In AR/VR steht der User am Welt-Origin (Boden). Boards 1.2m
                  hoch + 0.6m nach vorn platzieren, damit sie auf Tischhoehe
                  vor dem Lehrling schweben statt unter den Fuessen liegen. */}
              <group position={[0, 1.2, -0.6]} scale={[3, 3, 3]}>
                <DovetailSceneContents
                  params={params}
                  step={step}
                  withOrbitControls={false}
                />
                <XRStepBar
                  active={step}
                  onChange={(s) => {
                    setStep(s);
                    saveSession({ params, step: s, updatedAt: Date.now() });
                  }}
                />
              </group>
            </XR>
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
