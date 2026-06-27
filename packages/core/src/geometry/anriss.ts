/**
 * Schwalbenschwanz-ANRISS als neutrales 2D-Datenmodell.
 *
 * Trennt die fachliche BERECHNUNG von der DARSTELLUNG: dieses Modul liefert reine
 * Werte — Linien, Polygone, Abfallflächen, Maße — in brett-LOKALEN Millimetern.
 * KEINE 3D-Rohre, keine leuchtenden Schläuche, keine Farben. Der Consumer
 * (apps/tischler) rendert daraus flache Anrisslinien + halbtransparente
 * Abfallflächen direkt auf der Brettoberfläche, wie eine echte Anreißzeichnung.
 *
 * Koordinaten (Spec / Lehrbuch):
 *   X = über die Brettbreite        (0 … B)
 *   Y = Abstand von der Stirnkante   (0 = Stirnkante, D = Grundlinie)
 * Einheit: mm. Den kleinen Z-Versatz gegen Z-Fighting macht erst der Renderer.
 *
 * Keil-Richtung: die Schwalbe ist an der STIRNKANTE breit und verjüngt sich zur
 * Grundlinie (Flankenversatz = D / slopeRatio). Der Abfall dazwischen ist das
 * Gegenstück — an der Stirnkante schmal, zur Grundlinie breiter (nimmt später
 * den Zinken des Gegenstücks auf).
 */

import {
  computeDovetailLayout,
  type ConstructionOptions,
  type DovetailLayout,
  type DovetailMethod,
} from "./construction.js";

/** Punkt im Anriss-System (mm): x über die Breite, y Abstand von der Stirnkante. */
export interface AnrissPoint {
  x: number;
  y: number;
}

export type AnrissLineRole =
  | "baseline" // Grundlinie quer über das Brett (Abstand D)
  | "flank" // schräge Schwalbenflanke (Anriss-/Sägelinie)
  | "edge"; // Brettkante (gerade)

export interface AnrissLine {
  id: string;
  role: AnrissLineRole;
  a: AnrissPoint;
  b: AnrissPoint;
  /** Strichstärke in mm — der Renderer macht daraus ein dünnes flaches Band. */
  widthMm: number;
  style: "solid" | "dashed";
}

export type MaterialState = "keep" | "remove";

export interface AnrissArea {
  id: string;
  /** "tail" = Schwalbe (bleibt stehen) · "waste" = Abfall (wird entfernt). */
  role: "tail" | "waste";
  materialState: MaterialState;
  /** Geschlossenes Polygon, Reihenfolge: Stirnkante-links → Stirnkante-rechts → Grundlinie. */
  polygon: AnrissPoint[];
}

export interface AnrissDimension {
  id: string;
  /** Beschriftung, z.B. "T = 10,77 mm". */
  label: string;
  /** Ankerpunkt (mm) für die schwebende Maßangabe. */
  at: AnrissPoint;
}

export interface DovetailAnriss {
  board: { width: number; thickness: number };
  layout: DovetailLayout;
  /** Flankenversatz Stirnkante→Grundlinie (= D / slopeRatio). */
  flankOffset: number;
  /** Teilungspunkte auf der Stirnkante (X in mm). */
  divisions: number[];
  /** Grundlinie im Abstand D von der Stirnkante. */
  baseline: AnrissLine;
  /** Schräge Schwalbenflanken — die eigentlichen Anriss-/Sägelinien. */
  flanks: AnrissLine[];
  /** Schwalben (stehenbleibendes Holz, keine Füllung). */
  tails: AnrissArea[];
  /** Abfallbereiche (zu entfernen, halbtransparent). */
  wastes: AnrissArea[];
  /** Schwebende Maßangaben. */
  dimensions: AnrissDimension[];
}

/** mm auf eine Dezimale, deutsches Komma — für Maßbeschriftungen. */
function mm1(x: number): string {
  return x.toFixed(2).replace(".", ",");
}

/**
 * Baut den neutralen 2D-Anriss eines durchgehenden Schwalbenschwanzes.
 *
 * Muster (Methoden mit 1:2-Teilung): Zinken(1T) · Schwalbe(2T) · … · Zinken(1T).
 * Bei AZS Schwalben gibt es AZS+1 Abfall-Zinken. Die T-Grenzen sind
 * [0,1,3,4,…,AZT]; gerade Segmente = Abfall, ungerade = Schwalbe.
 *
 * @example B=140, D=20 → AZS=4, AZT=13, T=10,769, Versatz=3,333.
 */
export function buildDovetailAnriss(
  B: number,
  D: number,
  method: DovetailMethod = "mittellinie",
  opts: ConstructionOptions = {},
): DovetailAnriss {
  const layout = computeDovetailLayout(B, D, method, opts);
  const { AZS, T, slopeRatio } = layout;
  const flankOffset = D / slopeRatio;

  // T-Grenzen aufbauen: Start Zinken(1), dann je Schwalbe(2)+Zinken(1).
  const boundsT: number[] = [0];
  let acc = 0;
  for (let i = 0; i < AZS; i++) {
    acc += 1;
    boundsT.push(acc); // Ende eines Abfall-Zinkens
    acc += 2;
    boundsT.push(acc); // Ende einer Schwalbe
  }
  acc += 1;
  boundsT.push(acc); // letzter Abfall-Zinken → acc == AZT

  const xAt = (tUnits: number) => tUnits * T;
  const divisions = boundsT.map(xAt);

  const tails: AnrissArea[] = [];
  const wastes: AnrissArea[] = [];
  const flanks: AnrissLine[] = [];

  let tailIdx = 0;
  let wasteIdx = 0;
  for (let seg = 0; seg < boundsT.length - 1; seg++) {
    const left = xAt(boundsT[seg]!);
    const right = xAt(boundsT[seg + 1]!);
    const isTail = seg % 2 === 1; // 0=Abfall, 1=Schwalbe, …

    if (isTail) {
      // Schwalbe: breit an der Stirnkante (y=0), schmäler zur Grundlinie (y=D).
      const id = `tail-${String(tailIdx).padStart(2, "0")}`;
      tails.push({
        id,
        role: "tail",
        materialState: "keep",
        polygon: [
          { x: left, y: 0 },
          { x: right, y: 0 },
          { x: right - flankOffset, y: D },
          { x: left + flankOffset, y: D },
        ],
      });
      // Zwei Flanken (die eigentlichen Anrisslinien).
      flanks.push({
        id: `${id}-flank-l`,
        role: "flank",
        a: { x: left, y: 0 },
        b: { x: left + flankOffset, y: D },
        widthMm: 0.35,
        style: "solid",
      });
      flanks.push({
        id: `${id}-flank-r`,
        role: "flank",
        a: { x: right, y: 0 },
        b: { x: right - flankOffset, y: D },
        widthMm: 0.35,
        style: "solid",
      });
      tailIdx++;
    } else {
      // Abfall: schmal an der Stirnkante, breiter zur Grundlinie (Gegenstück).
      // An den Brettkanten bleibt die Kante senkrecht.
      const atLeftEdge = left <= 1e-6;
      const atRightEdge = right >= B - 1e-6;
      const leftBase = atLeftEdge ? left : left - flankOffset;
      const rightBase = atRightEdge ? right : right + flankOffset;
      wastes.push({
        id: `waste-${String(wasteIdx).padStart(2, "0")}`,
        role: "waste",
        materialState: "remove",
        polygon: [
          { x: left, y: 0 },
          { x: right, y: 0 },
          { x: rightBase, y: D },
          { x: leftBase, y: D },
        ],
      });
      wasteIdx++;
    }
  }

  const baseline: AnrissLine = {
    id: "baseline",
    role: "baseline",
    a: { x: 0, y: D },
    b: { x: B, y: D },
    widthMm: 0.4,
    style: "solid",
  };

  const dimensions: AnrissDimension[] = [
    { id: "dim-T", label: `T = ${mm1(T)} mm`, at: { x: T / 2, y: -2 } },
    { id: "dim-D", label: `Grundlinie ${mm1(D)} mm`, at: { x: B + 2, y: D } },
    { id: "dim-B", label: `B = ${mm1(B)} mm`, at: { x: B / 2, y: -6 } },
  ];

  return {
    board: { width: B, thickness: D },
    layout,
    flankOffset,
    divisions,
    baseline,
    flanks,
    tails,
    wastes,
    dimensions,
  };
}
