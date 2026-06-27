"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { generateMarkings } from "@craft-codex/core";
import type { DovetailParams, DovetailStep, MarkingLine } from "@craft-codex/core";

const SCALE_MM_TO_M = 0.001;
const BOARD_SEPARATION_M = 0.15;

/**
 * Anrisslinien als emissive 3D-Roehren (statt 1px-Lines).
 *
 * WARUM: `THREE.LineBasicMaterial` rendert in WebGL praktisch immer 1px breit
 * (die `lineWidth`-Property wird von den meisten GPUs ignoriert). Bei
 * AR-Passthrough auf Quest 3 / Galaxy XR verschwinden solche Linien im
 * Werkstattlicht komplett. TubeGeometry hat echte Welt-Breite und bleibt aus
 * jedem Blickwinkel sichtbar.
 *
 * Die semantischen Lehr-Farben (rot=schneiden, orange=hilfslinie, blau=passen,
 * gruen=pruefen) bleiben erhalten — sie werden nur emissiv aufgeladen und
 * pulsieren sanft, damit der Lehrling das Hologramm sofort vom realen Brett
 * unterscheidet.
 */
export function MarkingTubes({
  params,
  step,
  /** Roehren-Radius in mm (vor dem mm→m-Scale des Parents). Default 2.2mm. */
  radiusMm = 2.2,
  /** Sanftes Pulsieren der Emission an/aus. Default an. */
  pulse = true,
  /** Progressive Anzeige: nur Linien zeigen, deren id true ergibt. */
  markingFilter,
}: {
  params: DovetailParams;
  step: DovetailStep;
  radiusMm?: number;
  pulse?: boolean;
  markingFilter?: (id: string) => boolean;
}) {
  const markings = useMemo(
    () =>
      generateMarkings(step, params).filter(
        (m) => !markingFilter || markingFilter(m.id),
      ),
    [step, params, markingFilter],
  );

  return (
    <group
      // Identischer Scale + Y-Offset wie die MarkingLines-Komponente, damit die
      // Roehren exakt auf Brett A liegen.
      //
      // WICHTIG: `position` wirkt im ELTERN-Koordinatensystem (Meter) und wird
      // NICHT vom eigenen `scale` der Group beeinflusst — scale skaliert nur die
      // Kinder. Der Offset ist also direkt in Metern (BoardA sitzt bei
      // BOARD_SEPARATION_M/2 = 0,075 m, +1 mm Luft). Ein frueheres
      // `/ SCALE_MM_TO_M` machte daraus 76 m → die Roehren waren 76 Meter ueber
      // dem Brett, also unsichtbar (das war der "keine Striche"-Bug).
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, BOARD_SEPARATION_M / 2 + 0.001, 0]}
    >
      {markings.map((m) => (
        <MarkingTube key={m.id} marking={m} radiusMm={radiusMm} pulse={pulse} />
      ))}
    </group>
  );
}

function MarkingTube({
  marking,
  radiusMm,
  pulse,
}: {
  marking: MarkingLine;
  radiusMm: number;
  pulse: boolean;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => {
    const pts = dedupePoints(marking.points);
    if (pts.length < 2) return null;
    const vecs = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    // SCHARFE Ecken: gerade LineCurve3-Segmente statt CatmullRom-Glaettung.
    // Anrisslinien sind technische Zeichnungen — die Schwalben-Kontur muss als
    // klares keilfoermiges Trapez sitzen (wie im Lehrbuch), nicht als rundlicher
    // Blob. Eine CurvePath aus geraden Segmenten haelt jede Kante exakt.
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < vecs.length - 1; i++) {
      path.add(new THREE.LineCurve3(vecs[i]!, vecs[i + 1]!));
    }
    // Wenige Segmente pro gerader Strecke reichen (kein Bogen zu approximieren);
    // die Ecken bleiben dadurch knackig statt verschliffen.
    const segments = Math.max(2, (vecs.length - 1) * 2);
    return new THREE.TubeGeometry(path, segments, radiusMm, 8, false);
  }, [marking.points, radiusMm]);

  // GPU-Speicher freigeben, wenn sich die Geometrie aendert / beim Unmount.
  useEffect(() => () => geometry?.dispose(), [geometry]);

  // Sanfter, gemeinsamer Puls (Linie ist sofort voll sichtbar).
  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    if (!pulse) {
      mat.emissiveIntensity = 1.6;
      return;
    }
    const t = state.clock.elapsedTime;
    mat.emissiveIntensity = 1.7 + Math.sin(t * 3.9) * 0.6;
  });

  if (!geometry) return null;
  const color = new THREE.Color(marking.color);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={1.7}
        roughness={0.35}
        metalness={0}
        // Knallige Hologramm-Farbe, nicht vom Tonemapping abgedunkelt.
        toneMapped={false}
      />
    </mesh>
  );
}

/** Entfernt aufeinanderfolgende (quasi-)identische Punkte → keine 0-Segmente. */
function dedupePoints(
  points: Array<[number, number, number]>,
): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (
      !last ||
      Math.abs(last[0] - p[0]) > 1e-4 ||
      Math.abs(last[1] - p[1]) > 1e-4 ||
      Math.abs(last[2] - p[2]) > 1e-4
    ) {
      out.push(p);
    }
  }
  return out;
}
