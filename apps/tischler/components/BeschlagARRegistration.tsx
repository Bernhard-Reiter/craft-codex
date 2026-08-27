"use client";

/**
 * 3-Punkt-Registrierung des Türblatts per Controller-Spitze (Quest 3, WebXR).
 *
 * Adaptiert aus Christophe Barliebs ARRegistration (Fork-Branch chris/xr-deploy,
 * Original eabd41d): die getrackte Controllerspitze (Achsenkreuz, 15 cm voraus)
 * ist die Sonde. Drei Ecken der Beschlagfläche antippen — Punkt 1 = obere linke
 * Ecke (Ursprung), Punkt 2 = obere rechte (entlang X), Punkt 3 = untere linke
 * (entlang Y) — daraus kommt die starre Transformation Modell→Welt samt
 * RMS-Restfehler.
 *
 * Die Modell-Referenzpunkte entsprechen exakt den Ecken, an denen
 * BeschlagScene das Türblatt zeichnet (zentriert, mm→m).
 */

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import {
  XRSpace,
  useXRInputSourceEvent,
  useXRInputSourceState,
} from "@react-three/xr";
import { solveRigidFrom3Points, type Vec3 } from "@craft-codex/core";

export interface BeschlagRegistration {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  /** RMS-Restfehler in Metern. */
  rmsError: number;
}

const SCALE_MM_TO_M = 0.001;
const PROBE_DISTANCE = 0.15; // Achsenkreuz 15 cm vor dem Controller
const AXIS_LEN = 0.06;
const AXIS_R = 0.0022;

/** XYZ-Achsenkreuz (X rot, Y grün, Z blau). */
function AxisGizmo() {
  return (
    <group>
      <mesh position={[AXIS_LEN / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[AXIS_R, AXIS_R, AXIS_LEN, 10]} />
        <meshBasicMaterial color="#ff5555" />
      </mesh>
      <mesh position={[0, AXIS_LEN / 2, 0]}>
        <cylinderGeometry args={[AXIS_R, AXIS_R, AXIS_LEN, 10]} />
        <meshBasicMaterial color="#4ade80" />
      </mesh>
      <mesh position={[0, 0, AXIS_LEN / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[AXIS_R, AXIS_R, AXIS_LEN, 10]} />
        <meshBasicMaterial color="#4d8bff" />
      </mesh>
    </group>
  );
}

const PROMPTS = [
  "Punkt 1/3 — OBERE LINKE Ecke der Beschlagfläche",
  "Punkt 2/3 — OBERE RECHTE Ecke (entlang der Oberkante)",
  "Punkt 3/3 — UNTERE LINKE Ecke (entlang der linken Kante)",
];

export function BeschlagARRegistration({
  faceWidthMm,
  faceHeightMm,
  onRegistered,
}: {
  faceWidthMm: number;
  faceHeightMm: number;
  onRegistered: (result: BeschlagRegistration) => void;
}) {
  const tipRef = useRef<THREE.Group>(null);
  const [captured, setCaptured] = useState<Vec3[]>([]);

  const right = useXRInputSourceState("controller", "right");
  const left = useXRInputSourceState("controller", "left");
  // Rechts bevorzugen; targetRaySpace = Zeigeachse → Spitze VOR dem Controller.
  const controller = right ?? left;
  const probeSpace = controller?.inputSource?.targetRaySpace;

  // Modell-Referenzecken in den Koordinaten, in denen BeschlagScene zeichnet:
  // zentriert, x nach rechts, y nach oben, Beschlagfläche bei z=0.
  const model = useMemo<[Vec3, Vec3, Vec3]>(() => {
    const hw = (faceWidthMm / 2) * SCALE_MM_TO_M;
    const hh = (faceHeightMm / 2) * SCALE_MM_TO_M;
    return [
      [-hw, hh, 0], // obere linke Ecke = Ursprung des Bohrbild-Frames
      [hw, hh, 0], // obere rechte — entlang X
      [-hw, -hh, 0], // untere linke — entlang Y
    ];
  }, [faceWidthMm, faceHeightMm]);

  // Trigger erfasst die aktuelle Spitzenposition (Welt).
  useXRInputSourceEvent(
    "all",
    "select",
    () => {
      const tip = tipRef.current;
      if (!tip) return;
      const p = new THREE.Vector3();
      tip.getWorldPosition(p);
      setCaptured((prev) => {
        if (prev.length >= 3) return prev;
        const next: Vec3[] = [...prev, [p.x, p.y, p.z]];
        if (next.length === 3) {
          const t = solveRigidFrom3Points(model, next as [Vec3, Vec3, Vec3]);
          if (t) {
            onRegistered({
              position: t.position,
              quaternion: t.rotation,
              rmsError: t.rmsError,
            });
          }
          return []; // zurücksetzen; Parent beendet den Modus
        }
        return next;
      });
    },
    [model, onRegistered],
  );

  const promptIndex = Math.min(captured.length, 2);

  return (
    <>
      {probeSpace && (
        <XRSpace space={probeSpace}>
          {/* dünner Stiel vom Controller zur Spitze */}
          <mesh
            position={[0, 0, -PROBE_DISTANCE / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.0015, 0.0015, PROBE_DISTANCE, 12]} />
            <meshBasicMaterial color="#a4a4ac" />
          </mesh>
          <group ref={tipRef} position={[0, 0, -PROBE_DISTANCE]}>
            <AxisGizmo />
          </group>
        </XRSpace>
      )}

      {/* Bereits erfasste Punkte (grün). */}
      {captured.map((c, i) => (
        <mesh key={i} position={c}>
          <sphereGeometry args={[0.008, 16, 16]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
      ))}

      {/* Anweisung. */}
      <Billboard position={[0, 1.0, -0.6]}>
        <Text
          fontSize={0.02}
          color="#ffed00"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.7}
        >
          {probeSpace
            ? `Türblatt ausrichten · Kreuz auf die Ecke, Trigger drücken\n${PROMPTS[promptIndex]}`
            : "Ausrichten braucht einen Controller"}
        </Text>
      </Billboard>
    </>
  );
}
