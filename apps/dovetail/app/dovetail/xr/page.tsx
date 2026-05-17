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
    <main style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
      <Link
        href="/"
        style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}
      >
        ← zurueck
      </Link>
      <h1 style={{ marginTop: "1rem", fontSize: "1.6rem", fontWeight: 600 }}>
        Schwalbenschwanz im WebXR
      </h1>
      <p style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
        Dieselbe 3D-Scene wie /dovetail, jetzt mit echter WebXR-Session. Klick
        "Enter AR" auf einer Quest 3 oder Galaxy XR (oder Chrome mit WebXR
        Emulator) — das Brett erscheint dann in deinem Raum.
      </p>

      {support === null && (
        <p style={{ color: "var(--color-muted)" }}>Pruefe XR-Support…</p>
      )}

      {support && (
        <section
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Capability label="Immersive AR" supported={support.ar} />
            <Capability label="Immersive VR" supported={support.vr} />
          </div>
          {support.reason && (
            <p
              style={{
                marginTop: "1rem",
                color: "var(--color-muted)",
                fontSize: "0.85rem",
              }}
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
              style={buttonStyle(support.ar)}
            >
              Enter AR
            </button>
            <button
              type="button"
              disabled={!support.vr}
              onClick={enterVR}
              style={buttonStyle(support.vr)}
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
        style={{
          marginTop: "1.5rem",
          height: "60vh",
          minHeight: 400,
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Canvas
          shadows
          camera={{ position: [0.3, 0.25, 0.4], fov: 45 }}
          style={{ background: "#0b0d10" }}
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
        <div
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-card)",
          }}
        >
          Vorschau zeigt aktuellen Lernschritt: <strong>{step}</strong> · Brett
          {params.width_mm}×{params.length_mm}mm, {params.pinCount} Pins, 1:
          {params.ratio}. Aenderbar in /dovetail (state shared via
          localStorage).
        </div>
      </section>
    </main>
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
      style={{
        flex: "1 1 200px",
        padding: "0.75rem",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 6,
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div
        style={{
          fontSize: "0.85rem",
          color: supported ? "var(--color-accent)" : "var(--color-muted)",
        }}
      >
        {supported ? "supported" : "not available"}
      </div>
    </div>
  );
}

function FallbackMessage({ reason }: { reason?: string }) {
  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        background: "rgba(255, 184, 74, 0.08)",
        border: "1px solid rgba(255, 184, 74, 0.3)",
        borderRadius: 6,
        fontSize: "0.9rem",
        lineHeight: 1.5,
      }}
    >
      <strong>Kein XR-Device verfuegbar.</strong>
      <p style={{ margin: "0.5rem 0 0", color: "var(--color-muted)" }}>
        Du kannst die Demo trotzdem als 2D-Simulation nutzen unter{" "}
        <Link href="/dovetail" style={{ color: "var(--color-accent-warm)" }}>
          /dovetail
        </Link>
        . Fuer XR brauchst du Galaxy XR, Quest 3, oder Chrome mit WebXR Emulator
        (chrome://flags/#webxr-incubations).
      </p>
      {reason && (
        <p
          style={{
            margin: "0.5rem 0 0",
            color: "var(--color-muted)",
            fontSize: "0.8rem",
          }}
        >
          Detail: {reason}
        </p>
      )}
    </div>
  );
}

function buttonStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: "0.6rem 1.25rem",
    background: enabled ? "var(--color-accent)" : "transparent",
    color: enabled ? "#0b0d10" : "var(--color-muted)",
    border: `1px solid ${
      enabled ? "var(--color-accent)" : "var(--color-border)"
    }`,
    borderRadius: 6,
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: enabled ? "pointer" : "not-allowed",
  };
}
