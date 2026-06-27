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
      // Identischer Scale + Y-Offset wie die alte MarkingLines-Komponente,
      // damit die Roehren exakt auf Brett A liegen.
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, (BOARD_SEPARATION_M / 2 + 0.001) / SCALE_MM_TO_M, 0]}
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
  // Wachstum 0..1 — die Linie wird "gezogen" wie vom Streichmass/Stift.
  const growth = useRef(0);

  const geometry = useMemo(() => {
    const pts = dedupePoints(marking.points);
    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      false,
      // "centripetal" verhindert Schleifen/Ueberschwinger an Ecken —
      // Anrisslinien sind ueberwiegend gerade, das haelt sie sauber.
      "centripetal",
      0.5,
    );
    // tubularSegments proportional zur Polyline-Laenge, damit Ecken sitzen.
    const segments = Math.max(8, (pts.length - 1) * 8);
    return new THREE.TubeGeometry(curve, segments, radiusMm, 8, false);
  }, [marking.points, radiusMm]);

  // Neue Linie → von vorne wachsen.
  useEffect(() => {
    growth.current = 0;
    if (geometry?.index) geometry.setDrawRange(0, 0);
  }, [geometry]);

  // GPU-Speicher freigeben, wenn sich die Geometrie aendert / beim Unmount.
  useEffect(() => () => geometry?.dispose(), [geometry]);

  useFrame((state, delta) => {
    // Linie ueber ~0.9 s ausziehen (drawRange waechst entlang der Roehre).
    if (geometry?.index && growth.current < 1) {
      growth.current = Math.min(1, growth.current + delta * 1.1);
      const total = geometry.index.count;
      geometry.setDrawRange(0, Math.floor(growth.current * total));
    }
    // Sanfter, gemeinsamer Puls.
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
