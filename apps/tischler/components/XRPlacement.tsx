"use client";

import { useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { Vec3 } from "../lib/xr/use-board-placement";
import { XR_FONT_URL } from "../lib/xr/font";
import { Root, Text as UIText } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";

interface XRPlacementProps {
  position: Vec3;
  /** Live waehrend des Ziehens (X/Z auf horizontaler Ebene). */
  onDragMove: (next: Vec3) => void;
  /** Drag-Ende → Pose festschreiben. */
  onDragEnd: () => void;
  onHeight: (dir: 1 | -1) => void;
  onDepth: (dir: 1 | -1) => void;
  onReset: () => void;
  /** Visueller Scale der Bretter (XR: 3). Handle/Controls bleiben unskaliert. */
  contentScale?: number;
  /** Unskaliertes UI (z.B. Step-Bar), das in echter Groesse mitwandert. */
  overlay?: ReactNode;
  children: ReactNode;
}

/**
 * Platzierungs-Wrapper fuer den Brett-Stack in XR.
 *
 * - **Ziehgriff** (sichtbarer Henkel): Affordance fuer Laien — "hier anfassen
 *   zum Verschieben". Ziehen verschiebt das Brett ueber eine horizontale Ebene
 *   (X/Z), via Ray-Plane-Schnitt → funktioniert mit Maus (2D-Vorschau) UND
 *   XR-Controller/Hand-Ray, ohne dass der Strahl das Brett treffen muss.
 * - **Buttons** (Hoehe/Distanz/Reset): garantierter Pfad, falls Hand-Grab auf
 *   dem Zielgeraet zickt. Diskrete 5cm-Schritte, immer treffsicher.
 *
 * Die Bretter (children) liegen in einer separat skalierten Gruppe; Handle und
 * Controls bleiben unskaliert, damit Greif-Mathe und Button-Groessen stimmen.
 */
export function XRPlacement({
  position,
  onDragMove,
  onDragEnd,
  onHeight,
  onDepth,
  onReset,
  contentScale = 3,
  overlay,
  children,
}: XRPlacementProps) {
  const grab = useRef<{ id: number; offX: number; offZ: number } | null>(null);
  const [grabbed, setGrabbed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Wiederverwendbare Mathe-Objekte (keine Allokation pro Frame).
  const plane = useRef(new THREE.Plane());
  const hit = useRef(new THREE.Vector3());

  const intersectGroundPlane = (e: ThreeEvent<PointerEvent>): THREE.Vector3 | null => {
    // Horizontale Ebene auf aktueller Brett-Hoehe.
    plane.current.set(new THREE.Vector3(0, 1, 0), -position[1]);
    const point = e.ray.intersectPlane(plane.current, hit.current);
    return point ? point.clone() : null;
  };

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const p = intersectGroundPlane(e);
    if (!p) return;
    grab.current = {
      id: e.pointerId,
      offX: p.x - position[0],
      offZ: p.z - position[2],
    };
    setGrabbed(true);
    try {
      (e.target as Element & {
        setPointerCapture?: (id: number) => void;
      }).setPointerCapture?.(e.pointerId);
    } catch {
      // Pointer-Capture nicht verfuegbar (manche XR-Pointer) → Buttons greifen.
    }
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    e.stopPropagation();
    const p = intersectGroundPlane(e);
    if (!p) return;
    onDragMove([p.x - g.offX, position[1], p.z - g.offZ]);
  };

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    if (!grab.current || grab.current.id !== e.pointerId) return;
    e.stopPropagation();
    grab.current = null;
    setGrabbed(false);
    try {
      (e.target as Element & {
        releasePointerCapture?: (id: number) => void;
      }).releasePointerCapture?.(e.pointerId);
    } catch {
      /* no-op */
    }
    onDragEnd();
  };

  const handleColor = grabbed ? "#ffed00" : hovered ? "#5a6b3a" : "#3a4a2a";

  return (
    <group position={position}>
      <group scale={[contentScale, contentScale, contentScale]}>{children}</group>

      {/* Unskaliertes UI (Step-Bar) in echter Groesse, wandert mit dem Brett */}
      {overlay}

      {/* Ziehgriff unter dem Brett-Stack */}
      <group position={[0, -0.18, 0]}>
        <mesh
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[0.34, 0.05, 0.08]} />
          <meshStandardMaterial
            color={handleColor}
            emissive={grabbed ? "#ffed00" : "#000000"}
            emissiveIntensity={grabbed ? 0.5 : 0}
            roughness={0.6}
          />
        </mesh>
        <Text
          position={[0, 0, 0.045]}
          fontSize={0.022}
          color={grabbed ? "#0a0a0a" : "#e8e8e8"}
          anchorX="center"
          anchorY="middle"
          font={XR_FONT_URL}
        >
          {grabbed ? "ZIEHEN" : "VERSCHIEBEN"}
        </Text>
      </group>

      {/* Justier-Buttons: Hoehe / Distanz / Reset (garantierter Pfad) */}
      <PlacementControls
        position={[0.26, -0.05, 0]}
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
    <Button
      variant="pill"
      selected={accent}
      width={120}
      onClick={onClick}
    >
      <UIText fontSize={16}>{label}</UIText>
    </Button>
  );
}

