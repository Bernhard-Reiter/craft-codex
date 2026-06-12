"use client";

import { useState } from "react";
import { Text } from "@react-three/drei";
import type { DovetailStep } from "@craft-codex/core";

const STEPS: ReadonlyArray<DovetailStep> = [
  "anreissen",
  "saegen",
  "stemmen",
  "passen",
  "pruefen",
];

const LABELS: Record<DovetailStep, string> = {
  anreissen: "Anreissen",
  saegen: "Saegen",
  stemmen: "Stemmen",
  passen: "Passen",
  pruefen: "Pruefen",
};

interface XRStepBarProps {
  active: DovetailStep;
  onChange: (step: DovetailStep) => void;
  /** Y-Offset ueber dem Brett-Stack. Default: 0.4 (40cm hoeher) */
  yOffset?: number;
  /** Breite der gesamten Bar in Welt-Einheiten (m). Default: 0.6 */
  width?: number;
}

/**
 * 3D-ModeBar fuer den Schwalbenschwanz-Lernschritt im XR-Modus.
 *
 * 5 Quader nebeneinander, jeder als clickbarer Tab via R3F-Event-System.
 * Funktioniert mit Quest-Controllern (Trigger) und Hand-Tracking (Pinch).
 *
 * Phase D: ergaenzen um Slider-Aequivalent (Pinch+Drag fuer Pin-Anzahl etc.)
 */
export function XRStepBar({
  active,
  onChange,
  yOffset = 0.4,
  width = 0.6,
}: XRStepBarProps) {
  const buttonWidth = width / STEPS.length;
  const startX = -width / 2 + buttonWidth / 2;

  return (
    <group position={[0, yOffset, 0]}>
      {STEPS.map((step, i) => (
        <StepButton
          key={step}
          step={step}
          isActive={step === active}
          onClick={() => onChange(step)}
          position={[startX + i * buttonWidth, 0, 0]}
          width={buttonWidth * 0.9}
        />
      ))}
    </group>
  );
}

function StepButton({
  step,
  isActive,
  onClick,
  position,
  width,
}: {
  step: DovetailStep;
  isActive: boolean;
  onClick: () => void;
  position: [number, number, number];
  width: number;
}) {
  const [hovered, setHovered] = useState(false);

  const baseColor = isActive ? "#ffed00" : hovered ? "#32373c" : "#181715";
  const labelColor = isActive ? "#0a0a0a" : "#f0f0f0";

  return (
    <group position={position}>
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
        <boxGeometry args={[width, 0.05, 0.02]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>
      <BillboardLabel text={LABELS[step]} color={labelColor} width={width} />
    </group>
  );
}

function BillboardLabel({
  text,
  color,
  width: _width,
}: {
  text: string;
  color: string;
  width: number;
}) {
  return (
    <Text
      position={[0, 0, 0.012]}
      fontSize={0.018}
      color={color}
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}
