/**
 * Technische BEMASSUNG für den Schwalbenschwanz — fest an die Werkstückgeometrie
 * gebunden (wie eine Handzeichnung), NICHT als frei schwebender Text.
 *
 * Reine Daten (framework-frei) → unit-testbar. Jede Maßangabe besteht aus einer
 * gemessenen Spanne (a→b in Anriss-2D-mm), einem senkrechten Versatz der Maßlinie
 * (Hierarchie: Gesamtmaß aussen, Teil-/Einzelmaße nah am Werkstück), Richtung,
 * gerundetem Anzeigetext, EXAKTEM Wert (für Geometrie/Audit) und einem fachlichen
 * Erklärfeld. Der Consumer (apps/tischler) rendert daraus Maßhilfslinien,
 * Maßlinie, Begrenzungsstriche und den Maßtext flach auf der Zeichenebene.
 *
 * Koordinaten wie im Anriss: x ∈ [0,B] (Breite), y = Abstand von der Stirnkante
 * (0 = Stirnkante, D = Grundlinie). Maße OBERHALB der Stirnkante liegen bei y<0.
 *
 * WICHTIG (Spec §7/§9): Teilungspositionen IMMER aus B·index/AZT berechnen, nie
 * durch fortlaufendes Addieren des gerundeten T — sonst summieren sich Rundungs-
 * fehler. buildDovetailAnriss liefert die exakten divisions[] bereits so.
 */

import { buildDovetailAnriss, type AnrissPoint, type TeilungEbene } from "./anriss.js";
import type { ConstructionOptions, DovetailMethod } from "./construction.js";

export type DimKind =
  | "gesamt" // Gesamtmaß (z.B. Brettbreite) — aussen
  | "teil" // Teilmaß (Maßkette 1T/2T) — mittlere Ebene
  | "einzel" // Einzelmaß (z.B. T) — nah am Werkstueck
  | "dicke" // Brettdicke / Grundlinienabstand (senkrecht, rechts)
  | "verhaeltnis"; // Verhaeltnismass (Zinkenschraege 1:6)

export type DimDir = "horizontal" | "vertical";

export interface DimExplanation {
  was: string;
  wie: string;
  wozu: string;
  fehler: string;
}

export interface Dimension {
  id: string;
  kind: DimKind;
  /** Gemessene Spanne (Anriss-2D-mm). */
  a: AnrissPoint;
  b: AnrissPoint;
  /**
   * Senkrechter Versatz der Maßlinie von der Spanne (mm, vorzeichenbehaftet).
   * Hierarchie: Gesamtmaß grosser Versatz (aussen), Teil-/Einzelmaße klein.
   */
  offset: number;
  direction: DimDir;
  /** Gerundeter Anzeigetext, z.B. "B = 140 mm" oder "2T". */
  label: string;
  /** Exakter Wert (mm) — fuer Geometrie/Audit, NIE gerundet weiterrechnen. */
  exactValue: number;
  /** Fachliche Erklaerung (Spec §16): was/wie/wozu/Fehler. */
  explanation: DimExplanation;
  /** Lernschritte, in denen dieses Mass sichtbar ist (Spec §15). */
  phases: string[];
  /**
   * Nur fuer kind="verhaeltnis": Steigungsdreieck (3 Eckpunkte). Klarer als ein
   * senkrechtes Mass — zeigt 1 quer zu slopeRatio laengs. Der Renderer zeichnet
   * die drei Schenkel + das Verhaeltnis-Label.
   */
  triangle?: [AnrissPoint, AnrissPoint, AnrissPoint];
}

/** mm gerundet, deutsches Komma. */
function r(x: number, dec = 2): string {
  return x.toFixed(dec).replace(".", ",");
}

/**
 * Baut die technische Bemaßung (PR1-Kern): Brettbreite B (Gesamtmaß), Brettdicke
 * D / Grundlinienabstand, Teilbreite T, die 1T/2T-Maßkette und die Zinkenschräge.
 *
 * @example B=140, D=20 → AZS=4, AZT=13, T=10,769, Versatz 3,333.
 */
export function buildDovetailDimensions(
  B: number,
  D: number,
  method: DovetailMethod = "mittellinie",
  opts: ConstructionOptions = {},
  teilung: TeilungEbene = "stirn",
): Dimension[] {
  const A = buildDovetailAnriss(B, D, method, opts, teilung);
  const { AZS, AZT, T, slopeRatio, zinkenBreite, schwalbeBreite } = A.layout;
  const flankOffset = A.flankOffset;
  const teilungY = A.teilungY; // 0 (Stirn) oder D/2 (Mittellinie)
  const dims: Dimension[] = [];

  // A) Gesamtmaß Brettbreite B — aussen, oberhalb der Stirnkante (y<0).
  dims.push({
    id: "dim-board-width",
    kind: "gesamt",
    a: { x: 0, y: 0 },
    b: { x: B, y: 0 },
    offset: -22,
    direction: "horizontal",
    label: `B = ${r(B, 0)} mm`,
    exactValue: B,
    explanation: {
      was: "Die Brettbreite von Kante zu Kante.",
      wie: `Direkt gemessen; sie ist das Gesamtmaß der Zinkeneinteilung (alle ${AZT} Teile ergeben zusammen B).`,
      wozu: "Ausgangsmaß fuer die ganze Teilung — verhindert, dass sich Rundungsfehler ueber die Breite summieren.",
      fehler: "Falsche Breite → die letzte Teilung endet nicht an der Brettkante, die Verbindung wird unsymmetrisch.",
    },
    phases: ["messen", "teile", "markieren", "fertig"],
  });

  // B) Brettdicke D = Grundlinienabstand — senkrecht, rechts neben dem Brett.
  dims.push({
    id: "dim-board-thickness",
    kind: "dicke",
    a: { x: B, y: 0 },
    b: { x: B, y: D },
    offset: 16,
    direction: "vertical",
    label: `D = ${r(D, 0)} mm`,
    exactValue: D,
    explanation: {
      was: "Die Brettdicke — und zugleich der Abstand Stirnkante→Grundlinie.",
      wie: "Direkt gemessen. Bei offenen Zinken ist der Grundlinienabstand gleich der Dicke des Gegenstuecks.",
      wozu: "Bestimmt Grundlinie, Schwalbenlaenge, Saegetiefe und den seitlichen Flankenversatz.",
      fehler: "Falsche Dicke → Grundlinie sitzt falsch, die Bretter werden nach dem Fuegen nicht buendig.",
    },
    phases: ["messen", "streichmass", "fertig"],
  });

  // C) Teilbreite T — Einzelmaß, nah am Werkstueck (am ersten Teil).
  dims.push({
    id: "dim-part-width",
    kind: "einzel",
    a: { x: 0, y: 0 },
    b: { x: T, y: 0 },
    offset: -8,
    direction: "horizontal",
    label: `T = ${r(T)} mm`,
    exactValue: T,
    explanation: {
      was: "Das Grundmodul der Einteilung (Breite eines Teils auf der Mittellinie).",
      wie: `T = B / AZT = ${r(B, 0)} / ${AZT} = ${r(T)} mm (intern unrund weiterrechnen).`,
      wozu: "Auf der Mittellinie ist ein Zinken 1T, eine Schwalbe 2T breit.",
      fehler: "Mit gerundetem T 13-mal addiert entsteht ein Fehler; Positionen daher aus B·index/AZT rechnen.",
    },
    phases: ["teile"],
  });

  // D) 1T/2T-Maßkette — Teilmaße GEMESSEN auf der Teilungsebene (dort sind die
  //    Breiten exakt 1T/2T), die Maßlinie aussen ueber der Stirnkante (y=-8) mit
  //    Maßhilfslinien zur Teilungsebene. Positionen aus den exakten divisions[].
  const div = A.divisions; // [0,1T,3T,4T,...,B]
  const ketteY = -8;
  for (let i = 0; i < div.length - 1; i++) {
    const left = div[i]!;
    const right = div[i + 1]!;
    const isSchwalbe = i % 2 === 1; // 0=Zinken,1=Schwalbe,...
    dims.push({
      id: `dim-part-${i}`,
      kind: "teil",
      a: { x: left, y: teilungY },
      b: { x: right, y: teilungY },
      offset: ketteY - teilungY,
      direction: "horizontal",
      label: isSchwalbe ? "2T" : "1T",
      exactValue: right - left,
      explanation: {
        was: isSchwalbe ? "Eine Schwalbe — 2 Teile breit." : "Ein Zinken — 1 Teil breit.",
        wie: `Auf der Mittellinie; ${isSchwalbe ? `2T = ${r(schwalbeBreite)} mm` : `1T = ${r(zinkenBreite)} mm`}.`,
        wozu: `${AZS} Schwalben (2T) und ${AZS + 1} Zinken (1T) ergeben ${AZT}T = die ganze Breite.`,
        fehler: "Gleich breite Rechtecke waeren falsch — durch die Schraege aendert sich die Breite zur Stirnkante/Grundlinie.",
      },
      phases: ["markieren"],
    });
  }

  // E) Zinkenschräge als STEIGUNGSDREIECK (1 quer : slopeRatio laengs) — eindeutig
  //    fuer den Werker; ein senkrechtes Einzelmass wuerde wie eine Hoehe wirken.
  //    Rechts neben dem Brett: langer Senkrecht-Schenkel (slopeRatio), kurzer
  //    Quer-Schenkel (1), Hypotenuse = die Flanke.
  const u = 3; // mm pro Verhaeltnis-Einheit
  const triX = B + 12;
  const triY = 3;
  const tri: [AnrissPoint, AnrissPoint, AnrissPoint] = [
    { x: triX, y: triY }, // oben
    { x: triX, y: triY + slopeRatio * u }, // unten (slopeRatio laengs)
    { x: triX + u, y: triY + slopeRatio * u }, // 1 quer
  ];
  dims.push({
    id: "dim-slope",
    kind: "verhaeltnis",
    a: tri[0],
    b: tri[2],
    offset: 0,
    direction: "vertical",
    label: `1 : ${slopeRatio}`,
    exactValue: flankOffset,
    triangle: tri,
    explanation: {
      was: `Die Flankensteigung der Schwalbe, 1 : ${slopeRatio}.`,
      wie: `Seitlicher Versatz = D / ${slopeRatio} = ${r(D, 0)} / ${slopeRatio} = ${r(flankOffset)} mm ueber die Tiefe.`,
      wozu: "Mit Zinkenwinkel/Schmiege ohne Winkelmesser anreissbar; haelt die Verbindung auf Zug.",
      fehler: "Steiler bricht an den Spitzen aus, flacher haelt schlechter — 1:6 ist der bewaehrte Mittelweg.",
    },
    phases: ["schraege", "fertig"],
  });

  return dims;
}

/** Praefix-/ID-Match: ist ein Mass im aktuellen Lernschritt sichtbar? */
export function istMassSichtbar(dim: Dimension, phase: string): boolean {
  return dim.phases.includes(phase);
}
