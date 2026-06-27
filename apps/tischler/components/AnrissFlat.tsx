"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildDovetailAnriss } from "@craft-codex/core";
import type {
  AnrissArea,
  AnrissLine,
  DovetailMethod,
  TeilungEbene,
} from "@craft-codex/core";

const SCALE_MM_TO_M = 0.001;
const BOARD_SEPARATION_M = 0.15;

/**
 * Flacher Schwalbenschwanz-ANRISS auf der Brettoberfläche — wie eine echte
 * Anreißzeichnung, NICHT als leuchtende 3D-Rohre.
 *
 * Rendert das neutrale Datenmodell (buildDovetailAnriss) als:
 *  - dünne, flache Linien-Bänder (Grundlinie rot, Schwalbenflanken graphit),
 *  - halbtransparente Abfallflächen (orange) für das zu entfernende Holz,
 *  - kleine Teilungsmarken an der Stirnkante.
 * Stehenbleibendes Holz (Schwalben) bekommt KEINE Füllung — nur seine Flanken.
 *
 * Koordinaten-Mapping (Anriss 2D mm → 3D Brett-lokal):
 *   x3 = x − B/2            (über die Breite, zentriert)
 *   z3 = halfL − y          (y=0 Stirnkante → z=+halfL; y=D Grundlinie)
 *   y3 = winziger Versatz über der Oberfläche (Anti-Z-Fighting)
 * Die Gruppe trägt denselben mm→m-Scale + Y-Offset wie Brett A, ohne den
 * früheren 1-mm-Float (Linien lagen sichtbar über dem Holz).
 */
export function AnrissFlat({
  widthMm: B,
  thicknessMm: D,
  lengthMm: L,
  method = "mittellinie",
  teilung = "stirn",
  layers,
}: {
  widthMm: number;
  thicknessMm: number;
  lengthMm: number;
  method?: DovetailMethod;
  /** Teilungsebene: "stirn" (an der Stirnkante) oder "mittellinie" (Lehrbuch). */
  teilung?: TeilungEbene;
  /** Welche Anriss-Ebenen sichtbar sind (progressiv pro Lernschritt). */
  layers: ReadonlySet<AnrissLayer>;
}) {
  const anriss = useMemo(
    () => buildDovetailAnriss(B, D, method, {}, teilung),
    [B, D, method, teilung],
  );
  const halfL = L / 2;

  // 0,2 mm über der Oberseite; Füllungen minimal darunter, damit die Linien
  // sauber obenauf liegen.
  const yLine = 0.25;
  const yFill = 0.12;

  return (
    <group
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, BOARD_SEPARATION_M / 2, 0]}
    >
      {/* Abfallflächen zuerst (liegen unter den Linien). */}
      {layers.has("wastes") &&
        anriss.wastes.map((w) => (
          <AreaFill key={w.id} area={w} B={B} halfL={halfL} y={yFill} />
        ))}

      {/* Grundlinie — dünn, quer über das Brett. */}
      {layers.has("baseline") && (
        <LineRibbon
          line={anriss.baseline}
          B={B}
          halfL={halfL}
          y={yLine}
          color="#C62828"
        />
      )}

      {/* Schwalbenflanken — die eigentlichen Anriss-/Sägelinien. */}
      {layers.has("flanks") &&
        anriss.flanks.map((f) => (
          <LineRibbon
            key={f.id}
            line={f}
            B={B}
            halfL={halfL}
            y={yLine}
            color="#22304A"
          />
        ))}

      {/* Teilungsmarken an der Stirnkante. */}
      {layers.has("divisions") &&
        anriss.divisions.map((x, i) => (
          <DivisionTick key={`div-${i}`} x={x} B={B} halfL={halfL} y={yLine} />
        ))}
    </group>
  );
}

export type AnrissLayer =
  | "baseline"
  | "flanks"
  | "tails"
  | "wastes"
  | "divisions";

/** Anriss-2D-Punkt (mm) → 3D Brett-lokal (mm, vor dem Gruppen-Scale). */
function to3D(
  x: number,
  y: number,
  B: number,
  halfL: number,
  yWorld: number,
): THREE.Vector3 {
  return new THREE.Vector3(x - B / 2, yWorld, halfL - y);
}

/** Dünnes flaches Band (Quad) für eine gerade Linie, in der Brettebene. */
function LineRibbon({
  line,
  B,
  halfL,
  y,
  color,
}: {
  line: AnrissLine;
  B: number;
  halfL: number;
  y: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const a = to3D(line.a.x, line.a.y, B, halfL, y);
    const b = to3D(line.b.x, line.b.y, B, halfL, y);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    // Senkrechte in der xz-Ebene, halbe Strichbreite. Die fachliche Strichstärke
    // (0,3–0,4 mm) waere aus Arbeitsdistanz sub-pixel — daher eine Sichtbarkeits-
    // Breite mit Boden, damit der Anriss flach UND lesbar bleibt (auch im
    // XR-Passthrough), ohne zu Leucht-Rohren zu werden.
    const renderWidthMm = Math.max(line.widthMm * 2.6, 0.9);
    const hw = renderWidthMm / 2;
    const nx = (-dz / len) * hw;
    const nz = (dx / len) * hw;
    const verts = new Float32Array([
      a.x + nx, y, a.z + nz,
      b.x + nx, y, b.z + nz,
      b.x - nx, y, b.z - nz,
      a.x - nx, y, a.z - nz,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    return g;
  }, [line, B, halfL, y]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        side={THREE.DoubleSide}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

/** Halbtransparente Abfallfläche als flaches konvexes Polygon (Fan). */
function AreaFill({
  area,
  B,
  halfL,
  y,
}: {
  area: AnrissArea;
  B: number;
  halfL: number;
  y: number;
}) {
  const geometry = useMemo(() => {
    const pts = area.polygon.map((p) => to3D(p.x, p.y, B, halfL, y));
    const verts = new Float32Array(pts.flatMap((v) => [v.x, v.y, v.z]));
    const index: number[] = [];
    for (let i = 1; i < pts.length - 1; i++) index.push(0, i, i + 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, [area, B, halfL, y]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#E8843A"
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Kleine Teilungsmarke (kurzer Strich) an der Stirnkante. */
function DivisionTick({
  x,
  B,
  halfL,
  y,
}: {
  x: number;
  B: number;
  halfL: number;
  y: number;
}) {
  const geometry = useMemo(() => {
    const len = 4; // mm in die Fläche
    const hw = 0.5;
    const a = to3D(x, 0, B, halfL, y);
    const verts = new Float32Array([
      a.x - hw, y, a.z,
      a.x + hw, y, a.z,
      a.x + hw, y, a.z - len,
      a.x - hw, y, a.z - len,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    return g;
  }, [x, B, halfL, y]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#555555" side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
