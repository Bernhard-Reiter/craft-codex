"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import { Root, Container, Text } from "@react-three/uikit";
import { Card, Button } from "@react-three/uikit-apfel";
import { PencilRuler, Hammer, Crosshair } from "@react-three/uikit-lucide";
import {
  evaluateWristTrigger,
  palmNormalFromJoints,
  updateDwell,
  initialDwell,
  type Vec3,
  type DwellState,
} from "../lib/xr/wrist-trigger";

/**
 * Wrist-Menü im Meta-/visionOS-Stil: ein kompaktes Schnellmenü, das am
 * Handgelenk erscheint, sobald der Lehrling die Handfläche zu sich dreht und
 * hinschaut. Idiomatischer @react-three/xr-v6-Weg: Joint-Spaces direkt über
 * `hand.get('wrist')` lesen (kein Store-Umbau), Panel per Billboard zum
 * Betrachter ausrichten (robust gegen Handgelenk-Rotation).
 *
 * ⚠️ Hand-Tracking gibt es NUR in einer echten XR-Session. Ohne Hand rendert die
 * Komponente nichts — die Welt-Toolbar bleibt als Fallback (Desktop/Controller).
 * Die Trigger-Geometrie ist in lib/xr/wrist-trigger.ts isoliert + unit-getestet.
 */
/**
 * Übersetzte UI-Strings — das Menü rendert INNERHALB des R3F-Canvas,
 * useTranslations darf hier nicht aufgerufen werden. Die Seite baut das Objekt.
 */
export interface XRWristMenuLabels {
  tafel: string;
  plumb: string;
}

export function XRWristMenu({
  anreissModus,
  onModus,
  onPrev,
  onNext,
  onTafel,
  onZentrieren,
  onLotrecht,
  labels,
  /** Linke oder rechte Hand fürs Menü (Default links — rechts bedient). */
  handedness = "left",
}: {
  anreissModus: boolean;
  onModus: (anreiss: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onTafel: () => void;
  onZentrieren: () => void;
  onLotrecht: () => void;
  /** Übersetzte Strings — von der Seite (ausserhalb des Canvas) gereicht. */
  labels: XRWristMenuLabels;
  handedness?: "left" | "right";
}) {
  const handState = useXRInputSourceState("hand", handedness);
  const hand = handState?.inputSource?.hand ?? null;

  const wristRef = useRef<THREE.Object3D>(null);
  const indexRef = useRef<THREE.Object3D>(null);
  const pinkyRef = useRef<THREE.Object3D>(null);
  const dwellRef = useRef<DwellState>(initialDwell());
  const [shown, setShown] = useState(false);

  // Scratch-Vektoren (keine Allokation pro Frame).
  const wp = useRef(new THREE.Vector3());
  const ip = useRef(new THREE.Vector3());
  const pp = useRef(new THREE.Vector3());
  const hp = useRef(new THREE.Vector3());
  const hf = useRef(new THREE.Vector3());

  useFrame((state) => {
    const w = wristRef.current;
    const i = indexRef.current;
    const p = pinkyRef.current;
    if (!hand || !w || !i || !p) {
      if (shown) setShown(false);
      return;
    }
    w.getWorldPosition(wp.current);
    i.getWorldPosition(ip.current);
    p.getWorldPosition(pp.current);
    state.camera.getWorldPosition(hp.current);
    state.camera.getWorldDirection(hf.current);

    const wrist: Vec3 = [wp.current.x, wp.current.y, wp.current.z];
    const index: Vec3 = [ip.current.x, ip.current.y, ip.current.z];
    const pinky: Vec3 = [pp.current.x, pp.current.y, pp.current.z];
    const palmNormal = palmNormalFromJoints(wrist, index, pinky, handedness);

    const evalResult = evaluateWristTrigger({
      palmNormal,
      palmPos: wrist,
      headPos: [hp.current.x, hp.current.y, hp.current.z],
      headForward: [hf.current.x, hf.current.y, hf.current.z],
    });
    const nowMs = state.clock.elapsedTime * 1000;
    dwellRef.current = updateDwell(dwellRef.current, evalResult.active, nowMs);
    if (dwellRef.current.shown !== shown) setShown(dwellRef.current.shown);
  });

  if (!hand) return null;
  const wristSpace = hand.get("wrist");
  const indexSpace = hand.get("index-finger-metacarpal");
  const pinkySpace = hand.get("pinky-finger-metacarpal");
  if (!wristSpace || !indexSpace || !pinkySpace) return null;

  return (
    <>
      {/* Unsichtbare Joint-Anker, aus denen die Palm-Orientierung berechnet wird. */}
      <XRSpace space={wristSpace} ref={wristRef} />
      <XRSpace space={indexSpace} ref={indexRef} />
      <XRSpace space={pinkySpace} ref={pinkyRef} />

      {/* Das Menü selbst — am Handgelenk, leicht über dem Handrücken, billboardet. */}
      {shown && (
        <XRSpace space={wristSpace}>
          <group position={[0, 0.06, 0]}>
            <Billboard follow>
              <Root pixelSize={0.0006} anchorX="center" anchorY="center">
                <Card flexDirection="column" padding={10} gap={6} borderRadius={18}>
                  <Container flexDirection="row" gap={6}>
                    <Button
                      variant="icon"
                      size="sm"
                      selected={anreissModus}
                      onClick={() => onModus(true)}
                    >
                      <PencilRuler width={16} height={16} />
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      selected={!anreissModus}
                      onClick={() => onModus(false)}
                    >
                      <Hammer width={16} height={16} />
                    </Button>
                    <Button variant="icon" size="sm" onClick={onZentrieren}>
                      <Crosshair width={16} height={16} />
                    </Button>
                  </Container>
                  <Container flexDirection="row" gap={6}>
                    <Button variant="rect" onClick={onPrev}>
                      <Text fontSize={14}>{"<"}</Text>
                    </Button>
                    <Button variant="rect" onClick={onNext}>
                      <Text fontSize={14}>{">"}</Text>
                    </Button>
                    <Button variant="rect" onClick={onTafel}>
                      <Text fontSize={13}>{labels.tafel}</Text>
                    </Button>
                    <Button variant="rect" onClick={onLotrecht}>
                      <Text fontSize={13}>{labels.plumb}</Text>
                    </Button>
                  </Container>
                </Card>
              </Root>
            </Billboard>
          </group>
        </XRSpace>
      )}
    </>
  );
}
