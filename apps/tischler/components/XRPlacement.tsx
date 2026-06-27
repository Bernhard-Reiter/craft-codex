"use client";

import { type ReactNode } from "react";
import type { Vec3 } from "../lib/xr/use-board-placement";
import { Root, Text as UIText } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";

interface XRPlacementProps {
  position: Vec3;
  onHeight: (dir: 1 | -1) => void;
  onDepth: (dir: 1 | -1) => void;
  onReset: () => void;
  /** Visueller Scale der Bretter (XR: 3). Controls bleiben unskaliert. */
  contentScale?: number;
  /** Unskaliertes UI (z.B. Step-Bar), das in echter Groesse mitwandert. */
  overlay?: ReactNode;
  children: ReactNode;
}

/**
 * Platzierungs-Wrapper fuer den Brett-Stack in XR.
 *
 * Das Brett wird ueber die apfel-Buttons (Hoeher/Tiefer/Naeher/Weiter/Reset)
 * bewegt — der fruehere freie Ziehgriff war redundant und ist entfallen.
 * Die Bretter (children) liegen in einer separat skalierten Gruppe; die Controls
 * bleiben unskaliert.
 */
export function XRPlacement({
  position,
  onHeight,
  onDepth,
  onReset,
  contentScale = 3,
  overlay,
  children,
}: XRPlacementProps) {
  return (
    <group position={position}>
      <group scale={[contentScale, contentScale, contentScale]}>{children}</group>

      {/* Unskaliertes UI (Step-Bar) in echter Groesse, wandert mit dem Brett */}
      {overlay}

      {/* Brett-Justierung (apfel-Buttons) */}
      <PlacementControls
        position={[0.32, -0.05, 0]}
        onHeight={onHeight}
        onDepth={onDepth}
        onReset={onReset}
      />
    </group>
  );
}

function PlacementControls({
  position,
  onHeight,
  onDepth,
  onReset,
}: {
  position: [number, number, number];
  onHeight: (dir: 1 | -1) => void;
  onDepth: (dir: 1 | -1) => void;
  onReset: () => void;
}) {
  return (
    <group position={position}>
      <Root pixelSize={0.001} anchorX="center" anchorY="center">
        <Card flexDirection="column" gap={8} padding={12} borderRadius={20}>
          <CtrlButton label="Hoeher +" onClick={() => onHeight(1)} />
          <CtrlButton label="Tiefer -" onClick={() => onHeight(-1)} />
          <CtrlButton label="Naeher" onClick={() => onDepth(1)} />
          <CtrlButton label="Weiter" onClick={() => onDepth(-1)} />
          <CtrlButton label="Reset" onClick={onReset} accent />
        </Card>
      </Root>
    </group>
  );
}

function CtrlButton({
  label,
  onClick,
  accent = false,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <Button variant="pill" selected={accent} width={120} onClick={onClick}>
      <UIText fontSize={16}>{label}</UIText>
    </Button>
  );
}
