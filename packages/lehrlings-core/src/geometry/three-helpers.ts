/**
 * Three.js Mesh-Helpers fuer Schwalbenschwanz-Geometrie.
 *
 * Konvention (per dovetail.ts):
 *   X: Brettbreite, Y: Brettstaerke (vertical), Z: Brettlaenge.
 *   Origin: Mittelpunkt der Brettoberseite (y = 0 = Oberkante, y = -t = Unterkante).
 *
 * Pattern: `three` als Parameter — Consumer wired die THREE-Library rein.
 * three-bvh-csg ist als peerDependency direkt importiert (gleicher three-Pin via pnpm hoist).
 */

import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type * as THREE from "three";
import { computePins } from "./dovetail.js";
import type { DovetailParams, MarkingLine } from "./types.js";

const EPSILON = 0.01;

/**
 * Baut ein trapezoidales Prisma als BufferGeometry.
 *
 * Im XZ-Plane:
 *   - Bei z = zBase: X-Range [baseLeft, baseRight]
 *   - Bei z = zTop: X-Range [topLeft, topRight]
 *
 * Y-Extrusion: yMin..yMax (full Brettstaerke).
 */
function buildTrapezoidPrism(
  three: typeof THREE,
  baseLeft: number,
  baseRight: number,
  topLeft: number,
  topRight: number,
  yMin: number,
  yMax: number,
  zBase: number,
  zTop: number,
): THREE.BufferGeometry {
  const v = [
    baseLeft,
    yMin,
    zBase,
    baseRight,
    yMin,
    zBase,
    topRight,
    yMin,
    zTop,
    topLeft,
    yMin,
    zTop,
    baseLeft,
    yMax,
    zBase,
    baseRight,
    yMax,
    zBase,
    topRight,
    yMax,
    zTop,
    topLeft,
    yMax,
    zTop,
  ];
  const indices = [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, 0,
    4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
  ];
  const geom = new three.BufferGeometry();
  geom.setAttribute("position", new three.Float32BufferAttribute(v, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function makeBaseBoardBrush(
  three: typeof THREE,
  width: number,
  thickness: number,
  length: number,
): Brush {
  const baseGeom = new three.BoxGeometry(width, thickness, length);
  baseGeom.translate(0, -thickness / 2, 0);
  const brush = new Brush(baseGeom);
  brush.updateMatrixWorld();
  return brush;
}

/**
 * Brett A — die Pin-Seite (Stollen mit Schwalbenschwanz-Pins am +Z Hirnholz).
 *
 * Konstruktion: rechteckiger Body, dann werden die Zwischenraeume (zwischen
 * Pins + an den Enden) im Pin-Bereich (z = halfL - t bis halfL) ausgeschnitten.
 */
export function generateBoardAMesh(
  p: DovetailParams,
  three: typeof THREE,
): THREE.Mesh {
  const halfW = p.width_mm / 2;
  const halfL = p.length_mm / 2;
  const t = p.thickness_mm;
  const yMin = -t - EPSILON;
  const yMax = EPSILON;
  const zBase = halfL - t;
  const zTop = halfL + EPSILON;

  let result: Brush = makeBaseBoardBrush(three, p.width_mm, t, p.length_mm);
  const evaluator = new Evaluator();
  evaluator.attributes = ["position", "normal"];
  const pins = computePins(p);
  if (pins.length === 0) return new three.Mesh(result.geometry);

  const firstPin = pins[0]!;
  const lastPin = pins[pins.length - 1]!;

  const cuts: Array<{
    baseL: number;
    baseR: number;
    topL: number;
    topR: number;
  }> = [];

  cuts.push({
    baseL: -halfW - EPSILON,
    baseR: firstPin.wideLeft_mm,
    topL: -halfW - EPSILON,
    topR: firstPin.narrowLeft_mm,
  });

  for (let i = 0; i < pins.length - 1; i++) {
    const cur = pins[i]!;
    const next = pins[i + 1]!;
    cuts.push({
      baseL: cur.wideRight_mm,
      baseR: next.wideLeft_mm,
      topL: cur.narrowRight_mm,
      topR: next.narrowLeft_mm,
    });
  }

  cuts.push({
    baseL: lastPin.wideRight_mm,
    baseR: halfW + EPSILON,
    topL: lastPin.narrowRight_mm,
    topR: halfW + EPSILON,
  });

  for (const cut of cuts) {
    const cutGeom = buildTrapezoidPrism(
      three,
      cut.baseL,
      cut.baseR,
      cut.topL,
      cut.topR,
      yMin,
      yMax,
      zBase,
      zTop,
    );
    const cutBrush = new Brush(cutGeom);
    cutBrush.updateMatrixWorld();
    result = evaluator.evaluate(result, cutBrush, SUBTRACTION);
  }

  return new three.Mesh(result.geometry);
}

/**
 * Brett B — die Sockel-Seite (Wangen mit Pin-Aufnahmen).
 *
 * Konstruktion: rechteckiger Body, an einem Ende werden Pin-foermige
 * Aussparungen ausgeschnitten — passgenau zur Pin-Geometrie von Brett A.
 */
export function generateBoardBMesh(
  p: DovetailParams,
  three: typeof THREE,
): THREE.Mesh {
  const halfL = p.length_mm / 2;
  const t = p.thickness_mm;
  const yMin = -t - EPSILON;
  const yMax = EPSILON;
  const zBase = halfL - t;
  const zTop = halfL + EPSILON;

  let result: Brush = makeBaseBoardBrush(three, p.width_mm, t, p.length_mm);
  const evaluator = new Evaluator();
  evaluator.attributes = ["position", "normal"];
  const pins = computePins(p);

  for (const pin of pins) {
    const cutGeom = buildTrapezoidPrism(
      three,
      pin.wideLeft_mm,
      pin.wideRight_mm,
      pin.narrowLeft_mm,
      pin.narrowRight_mm,
      yMin,
      yMax,
      zBase,
      zTop,
    );
    const cutBrush = new Brush(cutGeom);
    cutBrush.updateMatrixWorld();
    result = evaluator.evaluate(result, cutBrush, SUBTRACTION);
  }

  return new three.Mesh(result.geometry);
}

/**
 * Konvertiert Anrisslinien zu einem THREE.LineSegments-Objekt.
 *
 * Jede MarkingLine ist eine POLYLINE (N Punkte = N-1 Segmente).
 * Vertex-Colors uebernommen aus marking.color (Hex).
 */
export function markingsToLineSegments(
  markings: MarkingLine[],
  three: typeof THREE,
): THREE.LineSegments {
  const positions: number[] = [];
  const colors: number[] = [];

  for (const marking of markings) {
    const color = new three.Color(marking.color);
    const pts = marking.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
  }

  const geom = new three.BufferGeometry();
  geom.setAttribute("position", new three.Float32BufferAttribute(positions, 3));
  geom.setAttribute("color", new three.Float32BufferAttribute(colors, 3));

  const material = new three.LineBasicMaterial({ vertexColors: true });
  return new three.LineSegments(geom, material);
}
