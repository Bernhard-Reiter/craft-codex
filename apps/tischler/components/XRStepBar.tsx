"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { DovetailStep } from "@craft-codex/core";
import { XR_FONT_URL } from "../lib/xr/font";

// XR zeigt die fünf Handschritte — "ueberblick" (Schritt 0) ist 2D-Erklärung.
type CraftStep = Exclude<DovetailStep, "ueberblick">;

const STEPS: ReadonlyArray<CraftStep> = [
  "anreissen",
  "saegen",
  "stemmen",
  "passen",
  "pruefen",
];

const LABELS: Record<CraftStep, string> = {
  anreissen: "Anreissen",
  saegen: "Saegen",
  stemmen: "Stemmen",
  passen: "Passen",
  pruefen: "Pruefen",
};

interface XRStepBarProps {
  active: DovetailStep;
  onChange: (step: DovetailStep) => void;
  /** Y-Offset ueber dem Brett-Stack in echten Metern. Default: 0.32 */
  yOffset?: number;
  /** Breite der gesamten Bar in echten Metern. Default: 0.66 */
  width?: number;
}

/**
 * 3D-Lernschritt-Leiste fuer den XR-Modus.
 *
 * Headset-tauglich (Brainstorm-Vorgaben):
 * - Grosse Trefferflaechen (~11cm breit, 7cm hoch) — Pinch-/Trigger-sicher
 *   auch fuer Laien, deutlich ueber dem 5cm-Minimum.
 * - Nummern-Badge 1–5 + Klartext-Label → "wo bin ich" ohne Vorwissen.
 * - Sichtbare Zustaende: idle / hover (groesser + heller) / active (gelb,
 *   leicht vorgeschoben). Sanftes Scale-Lerp gibt fuehlbares Pinch-Feedback.
 *
 * Wird UNSKALIERT gerendert (echte Meter), damit die Bar erreichbar bleibt und
 * nicht mit dem 3x-Brett-Scale ueber Kopfhoehe wandert.
 */
export function XRStepBar({
  active,
  onChange,
  yOffset = 0.32,
  width = 0.66,
}: XRStepBarProps) {
  const slot = width / STEPS.length;
  const buttonWidth = slot * 0.92;
  const startX = -width / 2 + slot / 2;

  return (
    <group position={[0, yOffset, 0]}>
      {STEPS.map((step, i) => (
        <StepButton
          key={step}
          index={i}
          step={step}
          isActive={step === active}
          onClick={() => onChange(step)}
          position={[startX + i * slot, 0, 0]}
          width={buttonWidth}
        />
      ))}
    </group>
  );
}

function StepButton({
  index,
  step,
  isActive,
  onClick,
  position,
  width,
}: {
  index: number;
  step: CraftStep;
  isActive: boolean;
  onClick: () => void;
  position: [number, number, number];
  width: number;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Weiches Scale-/Tiefen-Feedback: active bzw. hover hebt den Tab fuehlbar an.
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const targetScale = isActive ? 1.14 : hovered ? 1.08 : 1;
    const targetZ = isActive ? 0.03 : hovered ? 0.015 : 0;
    g.scale.x += (targetScale - g.scale.x) * 0.25;
    g.scale.y += (targetScale - g.scale.y) * 0.25;
    g.scale.z += (targetScale - g.scale.z) * 0.25;
    g.position.z += (targetZ - g.position.z) * 0.25;
  });

  const baseColor = isActive ? "#ffed00" : hovered ? "#32373c" : "#181715";
  const fg = isActive ? "#0a0a0a" : "#f0f0f0";
  const height = 0.07;

  return (
    <group ref={groupRef} position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[width, height, 0.022]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={isActive ? "#ffed00" : "#000000"}
          emissiveIntensity={isActive ? 0.35 : 0}
          roughness={0.5}
        />
      </mesh>

      {/* Nummern-Badge */}
      <Text
        position={[0, 0.016, 0.014]}
        fontSize={0.026}
        color={fg}
        anchorX="center"
        anchorY="middle"
        font={XR_FONT_URL}
      >
        {String(index + 1)}
      </Text>
      {/* Klartext-Label */}
      <Text
        position={[0, -0.016, 0.014]}
        fontSize={0.015}
        color={fg}
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 0.95}
        font={XR_FONT_URL}
      >
        {LABELS[step]}
      </Text>
    </group>
  );
}
