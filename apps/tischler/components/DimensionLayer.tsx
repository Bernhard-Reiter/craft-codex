"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Root, Text } from "@react-three/uikit";
import {
  buildDovetailDimensions,
  istMassSichtbar,
  type Dimension,
  type TeilungEbene,
} from "@craft-codex/core";

const SCALE_MM_TO_M = 0.001;
const BOARD_SEPARATION_M = 0.15;

/**
 * Technische BEMASSUNG, fest an die Werkstückgeometrie gebunden (Spec §17).
 *
 * Rendert das Dimensions-Datenmodell als echte Maßketten — Maßhilfslinien,
 * Maßlinie, Begrenzungsstriche (45°-Schraegstriche) und flachen Maßtext — auf
 * derselben Zeichenebene wie der Anriss (0,3 mm ueber der Oberflaeche, bewegt
 * und dreht sich mit dem Brett). KEIN frei schwebender Text.
 *
 * Hierarchie ueber den Versatz: Gesamtmaß aussen, Teil-/Einzelmaße nah am
 * Werkstueck. Pro Lernschritt nur die passenden Maße (Spec §15).
 */
export function DimensionLayer({
  widthMm: B,
  thicknessMm: D,
  lengthMm: L,
  phase,
  teilung = "stirn",
}: {
  widthMm: number;
  thicknessMm: number;
  lengthMm: number;
  /** Aktueller Lernschritt — blendet nur die zugehoerigen Maße ein. */
  phase: string;
  /** Teilungsebene: Maße folgen der Stirn- oder Mittellinien-Teilung. */
  teilung?: TeilungEbene;
}) {
  const dims = useMemo(
    () =>
      buildDovetailDimensions(B, D, "mittellinie", {}, teilung).filter((d) =>
        istMassSichtbar(d, phase),
      ),
    [B, D, phase, teilung],
  );
  const halfL = L / 2;
  const yLine = 0.32; // mm ueber der Oberseite

  return (
    <group
      scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}
      position={[0, BOARD_SEPARATION_M / 2, 0]}
    >
      {dims.map((d) => (
        <DimensionView key={d.id} dim={d} B={B} halfL={halfL} y={yLine} />
      ))}
    </group>
  );
}

/** Anriss-2D (mm) → 3D Brett-lokal (mm). */
function p3(x: number, y2d: number, B: number, halfL: number, y3: number): THREE.Vector3 {
  return new THREE.Vector3(x - B / 2, y3, halfL - y2d);
}

function DimensionView({
  dim,
  B,
  halfL,
  y,
}: {
  dim: Dimension;
  B: number;
  halfL: number;
  y: number;
}) {
  // Verhaeltnismass = Steigungsdreieck: drei Schenkel + Label am Schwerpunkt.
  if (dim.kind === "verhaeltnis" && dim.triangle) {
    const [t1, t2, t3] = dim.triangle;
    const c = { x: (t1.x + t2.x + t3.x) / 3, y: (t1.y + t2.y + t3.y) / 3 };
    const lp = p3(c.x + 8, c.y, B, halfL, y + 0.05);
    return (
      <group>
        <Ribbon a={t1} b={t2} B={B} halfL={halfL} y={y} w={0.3} color="#33415c" />
        <Ribbon a={t2} b={t3} B={B} halfL={halfL} y={y} w={0.3} color="#33415c" />
        <Ribbon a={t3} b={t1} B={B} halfL={halfL} y={y} w={0.32} color="#1d2c4a" />
        <group position={[lp.x, lp.y, lp.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <Root pixelSize={1} anchorX="center" anchorY="center">
            <Text fontSize={13} color="#1d2c4a" fontWeight="bold">{dim.label}</Text>
          </Root>
        </group>
      </group>
    );
  }

  const horizontal = dim.direction === "horizontal";

  // Maßlinie um den Versatz senkrecht zur Spanne verschoben.
  const aSpan = dim.a;
  const bSpan = dim.b;
  const aLine = horizontal
    ? { x: aSpan.x, y: aSpan.y + dim.offset }
    : { x: aSpan.x + dim.offset, y: aSpan.y };
  const bLine = horizontal
    ? { x: bSpan.x, y: bSpan.y + dim.offset }
    : { x: bSpan.x + dim.offset, y: bSpan.y };

  const dimColor = dim.kind === "gesamt" ? "#1d2c4a" : "#33415c";
  // Pencil-fein wie ein gut gespitzter Bleistift (Spec: Maßlinie 0,30 / Hilfs-
  // linie 0,25 mm). Aus schraegem Vorschau-Winkel subtil — auf der Quest (naher,
  // gerader Blick) klar als feine technische Linie.
  const widths = { dimLine: 0.3, ext: 0.22, tick: 0.3 };

  // Label-Position: Mitte der Maßlinie, etwas ueber die Linie hinaus.
  const midX = (aLine.x + bLine.x) / 2;
  const midY = (aLine.y + bLine.y) / 2;
  const labelOff = horizontal ? (dim.offset < 0 ? -5 : 5) : 0;
  const labelX = horizontal ? midX : midX + 7;
  const labelY = horizontal ? midY + labelOff : midY;
  const labelPos = p3(labelX, labelY, B, halfL, y + 0.05);

  return (
    <group>
      {/* Maßhilfslinien (Extension lines) — von der Spanne zur Maßlinie. */}
      <Ribbon a={aSpan} b={aLine} B={B} halfL={halfL} y={y} w={widths.ext} color={dimColor} />
      <Ribbon a={bSpan} b={bLine} B={B} halfL={halfL} y={y} w={widths.ext} color={dimColor} />
      {/* Maßlinie */}
      <Ribbon a={aLine} b={bLine} B={B} halfL={halfL} y={y} w={widths.dimLine} color={dimColor} />
      {/* Begrenzungsstriche (45°-Schraegstriche) an beiden Enden */}
      <Tick at={aLine} B={B} halfL={halfL} y={y} w={widths.tick} color={dimColor} />
      <Tick at={bLine} B={B} halfL={halfL} y={y} w={widths.tick} color={dimColor} />
      {/* Maßtext flach in der Ebene */}
      <group position={[labelPos.x, labelPos.y, labelPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <Root pixelSize={1} anchorX="center" anchorY="center">
          <Text fontSize={13} color={dimColor} fontWeight="bold">
            {dim.label}
          </Text>
        </Root>
      </group>
    </group>
  );
}

/** Dünnes flaches Band fuer eine gerade (Maß-/Hilfs-)Linie. */
function Ribbon({
  a,
  b,
  B,
  halfL,
  y,
  w,
  color,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  B: number;
  halfL: number;
  y: number;
  w: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const A = p3(a.x, a.y, B, halfL, y);
    const Bp = p3(b.x, b.y, B, halfL, y);
    const dx = Bp.x - A.x;
    const dz = Bp.z - A.z;
    const len = Math.hypot(dx, dz) || 1;
    const hw = w / 2;
    const nx = (-dz / len) * hw;
    const nz = (dx / len) * hw;
    const verts = new Float32Array([
      A.x + nx, y, A.z + nz,
      Bp.x + nx, y, Bp.z + nz,
      Bp.x - nx, y, Bp.z - nz,
      A.x - nx, y, A.z - nz,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    return g;
  }, [a.x, a.y, b.x, b.y, B, halfL, y, w]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/** Begrenzungszeichen: kurzer 45°-Schraegstrich am Endpunkt. */
function Tick({
  at,
  B,
  halfL,
  y,
  w,
  color,
}: {
  at: { x: number; y: number };
  B: number;
  halfL: number;
  y: number;
  w: number;
  color: string;
}) {
  const len = 2.2; // mm in jede Richtung (45°)
  const a = { x: at.x - len, y: at.y - len };
  const b = { x: at.x + len, y: at.y + len };
  return <Ribbon a={a} b={b} B={B} halfL={halfL} y={y} w={w} color={color} />;
}
