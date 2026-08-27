"use client";

/**
 * Beschlag-Szene — Türblatt mit Bohrbild und Bemaßung.
 *
 * Zwei Darstellungszustände, gesteuert vom Prüfstand des Bohrbilds:
 *
 *   entwurf   Nur die Maßketten. Sie laden zum Nachmessen ein und behaupten
 *             nichts über die genaue Lage.
 *   geprueft  Zusätzlich die Bohrpunkte. Ein Punkt sieht verbindlich aus —
 *             deshalb erst, wenn er es auch ist.
 *
 * Alle Modellmaße kommen in Millimetern herein; die Umrechnung nach Meter
 * passiert genau einmal, über die scale der äußeren Group.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { Root, Text } from "@react-three/uikit";
import {
  mayRenderDrillPoints,
  resolveDrillY,
  type DrillPoint,
  type DimensionChain,
  type HardwareLayout,
} from "@craft-codex/core";

const SCALE_MM_TO_M = 0.001;

/** Dicke des dargestellten Türblatts in mm. */
const PANEL_THICKNESS = 19;

const FARBE = {
  panel: "#d9d2c5",
  panelKante: "#b3a893",
  bohrung: "#1d2c4a",
  topf: "#7d2b1f",
  massLinie: "#33415c",
  massText: "#1d2c4a",
  offen: "#8a6a1f",
} as const;

export interface BeschlagSceneProps {
  layout: HardwareLayout;
  /** Türblatthöhe in mm — bestimmt, wo die ab Unterkante bemaßten Bohrungen liegen. */
  faceHeight: number;
  /** Nur die Bohrungen dieses Schritts hervorheben; alle übrigen blasser. */
  activeStepId?: string;
}

/** Modellkoordinaten (x ab links, y ab Oberkante) → Three-Koordinaten, zentriert. */
function toScene(
  xMm: number,
  yFromTopMm: number,
  width: number,
  height: number,
): [number, number] {
  return [xMm - width / 2, height / 2 - yFromTopMm];
}

export function BeschlagScene({
  layout,
  faceHeight,
  activeStepId,
}: BeschlagSceneProps) {
  const zeigeBohrungen = useMemo(() => mayRenderDrillPoints(layout), [layout]);
  const W = layout.faceWidth;
  const H = faceHeight;
  const kanten = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, 0.1)),
    [W, H],
  );

  return (
    <group scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}>
      {/* Türblatt */}
      <mesh position={[0, 0, -PANEL_THICKNESS / 2]}>
        <boxGeometry args={[W, H, PANEL_THICKNESS]} />
        <meshStandardMaterial color={FARBE.panel} roughness={0.85} />
      </mesh>

      {/* Kantenlinien — macht die Bezugskanten der Bemaßung sichtbar */}
      <lineSegments geometry={kanten} position={[0, 0, 0.2]}>
        <lineBasicMaterial color={FARBE.panelKante} />
      </lineSegments>

      {zeigeBohrungen &&
        layout.points.map((p) => (
          <Bohrung
            key={p.id}
            point={p}
            width={W}
            height={H}
            aktiv={!activeStepId || p.stepId === activeStepId}
          />
        ))}

      {layout.chains.map((c) => (
        <Masskette
          key={c.id}
          chain={c}
          points={layout.points}
          width={W}
          height={H}
        />
      ))}
    </group>
  );
}

function Bohrung({
  point,
  width,
  height,
  aktiv,
}: {
  point: DrillPoint;
  width: number;
  height: number;
  aktiv: boolean;
}) {
  const [x, y] = toScene(point.x, resolveDrillY(point, height), width, height);
  const r = point.diameter / 2;
  const istTopf = point.diameter >= 20;

  return (
    <group position={[x, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, point.depth, 24]} />
        <meshStandardMaterial
          color={istTopf ? FARBE.topf : FARBE.bohrung}
          transparent
          opacity={aktiv ? 0.9 : 0.25}
        />
      </mesh>
    </group>
  );
}

/**
 * Eine Maßkette als Maßlinie mit Segmenten.
 *
 * Die Segmente werden an den Bohrungen aufgehängt, auf die sie messen. Fehlt
 * einer Kette der Bezug (`toPointId` nicht gesetzt), wird sie ab der
 * Bezugskante gestaffelt — die Werte stimmen dann weiterhin, nur die
 * Aufhängung ist rechnerisch statt geometrisch.
 */
function Masskette({
  chain,
  points,
  width,
  height,
}: {
  chain: DimensionChain;
  points: DrillPoint[];
  width: number;
  height: number;
}) {
  const horizontal = chain.axis === "x";
  // Maßlinien der x-Ketten unter das Blatt, die der y-Ketten daneben.
  const offset = horizontal ? -height / 2 - 60 : -width / 2 - 60;

  let laufend = 0;
  const marken = chain.segments.map((s) => {
    laufend += s.value;
    const p = s.toPointId ? points.find((q) => q.id === s.toPointId) : undefined;
    const posMm = p
      ? horizontal
        ? p.x
        : resolveDrillY(p, height)
      : laufend;
    return { label: s.label, posMm, mitteMm: posMm - s.value / 2 };
  });

  return (
    <group position={[0, 0, 1]}>
      {marken.map((m, i) => {
        const [tx, ty] = horizontal
          ? [m.mitteMm - width / 2, offset]
          : [offset, height / 2 - m.mitteMm];
        return (
          <group key={`${chain.id}-${i}`} position={[tx, ty, 0]}>
            <Root pixelSize={1} anchorX="center" anchorY="center">
              <Text fontSize={14} color={FARBE.massText} fontWeight="normal">
                {m.label}
              </Text>
            </Root>
          </group>
        );
      })}

      {/* Beschriftung der Bezugskante */}
      <group
        position={
          horizontal
            ? [-width / 2, offset - 34, 0]
            : [offset - 34, height / 2, 0]
        }
      >
        <Root pixelSize={1} anchorX="center" anchorY="center">
          <Text fontSize={11} color={FARBE.massLinie} fontWeight="normal">
            {`ab ${chain.from}`}
          </Text>
        </Root>
      </group>
    </group>
  );
}
