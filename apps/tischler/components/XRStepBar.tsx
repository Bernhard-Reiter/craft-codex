"use client";

import { Root, Container, Text as UIText } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import type { DovetailStep } from "@craft-codex/core";

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
}

/**
 * 3D-Lernschritt-Leiste im apfel-Kit-Stil (Quest/Vision-Glas). Aktiver Schritt
 * = blauer (selected) Button, Flexbox-Layout statt manueller Koordinaten.
 */
export function XRStepBar({ active, onChange, yOffset = 0.32 }: XRStepBarProps) {
  return (
    <group position={[0, yOffset, 0]}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Card flexDirection="row" gap={8} padding={12} borderRadius={22}>
          {STEPS.map((step, i) => (
            <Button
              key={step}
              variant="rect"
              selected={step === active}
              onClick={() => onChange(step)}
            >
              <Container flexDirection="column" alignItems="center">
                <UIText fontSize={18}>{String(i + 1)}</UIText>
                <UIText fontSize={12}>{LABELS[step]}</UIText>
              </Container>
            </Button>
          ))}
        </Card>
      </Root>
    </group>
  );
}
