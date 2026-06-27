"use client";

import { type ReactNode } from "react";
import { Handle, HandleTarget } from "@react-three/handle";
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
 * Das Brett ist mit der HAND greifbar (via @react-three/handle): anfassen →
 * schieben + drehen + positionieren. Funktioniert mit Hand-Tracking, Controller
 * UND Maus (2D-Vorschau). Zusaetzlich bleiben die apfel-Buttons (Hoehe/Distanz/
 * Reset) als treffsicherer Pfad.
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
      {/* Greifbares Holzstueck: Hand/Controller fasst an, HandleTarget folgt. */}
      <HandleTarget>
        <Handle targetRef="from-context" translate rotate scale={false}>
          <group scale={[contentScale, contentScale, contentScale]}>
            {children}
          </group>
        </Handle>
      </HandleTarget>

      {/* Unskaliertes UI (Step-Bar) in echter Groesse, wandert mit dem Brett */}
      {overlay}

      {/* Brett-Justierung (apfel-Buttons) — treffsicherer Zweitpfad */}
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
