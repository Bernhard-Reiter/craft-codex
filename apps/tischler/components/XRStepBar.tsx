"use client";

import type { DovetailStep } from "@craft-codex/core";
import { XRButton } from "./XRButton";

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
  /** Breite der gesamten Bar in echten Metern. Default: 0.7 */
  width?: number;
}

/**
 * 3D-Lernschritt-Leiste fuer den XR-Modus — jetzt im Meta-Quest-Button-Stil
 * (XRButton). Aktiver Schritt = Meta-Blau, Hover hebt deutlich an.
 */
export function XRStepBar({
  active,
  onChange,
  yOffset = 0.32,
  width = 0.7,
}: XRStepBarProps) {
  const slot = width / STEPS.length;
  const buttonWidth = slot * 0.92;
  const startX = -width / 2 + slot / 2;

  return (
    <group position={[0, yOffset, 0]}>
      {STEPS.map((step, i) => (
        <XRButton
          key={step}
          label={`${i + 1}\n${LABELS[step]}`}
          active={step === active}
          onClick={() => onChange(step)}
          position={[startX + i * slot, 0, 0]}
          width={buttonWidth}
          height={0.08}
          fontSize={0.014}
        />
      ))}
    </group>
  );
}
