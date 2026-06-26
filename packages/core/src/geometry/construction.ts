/**
 * Schwalbenschwanz-KONSTRUKTION nach Lehrbuch (Konstruktionslehre Kap. 4,
 * Zinkenverbindungen / Kompetenz-Check 8).
 *
 * Waehrend `computePins()` aus einer FREI gewaehlten Pin-Anzahl zeichnet (Slider-
 * Modus), berechnet diese Datei die vom Lehrbuch EMPFOHLENE Teilung aus nur zwei
 * Eingaben: Brettbreite B und Brettdicke D. Alle Zwischenwerte werden als Daten
 * zurueckgegeben, damit der Meister sie dem Lehrling Schritt fuer Schritt
 * vorrechnen kann ("AZS = B/(1,7*D) = ... ≈ 4 Schwalben").
 *
 * Begriffe (Lehrbuch):
 *  B   Brettbreite        D   Brettdicke
 *  AZS Anzahl Schwalben   AZT Anzahl Einteilungsteile
 *  T   Breite eines Teils ZS  Konstruktionsmass der Schraege
 *  RZV Randzinkenverstaerkung RB Restbreite
 *  SL  Schwalbenlaenge    BL  Blattstaerke (halbverdeckt)
 *
 * Reine Mathematik — framework-agnostisch, keine Three.js-Imports.
 */

export type DovetailMethod = "mittellinie" | "randverstaerkung" | "grundlinie";

export interface DovetailLayout {
  method: DovetailMethod;
  /** Brettbreite (mm) */
  B: number;
  /** Brettdicke (mm) */
  D: number;
  /** Schwalbenzahl, ungerundet (zum Vorrechnen) */
  AZS_raw: number;
  /** Schwalbenzahl, gerundet */
  AZS: number;
  /** Anzahl Einteilungsteile */
  AZT: number;
  /** Breite eines Teils (mm) */
  T: number;
  /** Zinkenbreite = 1·T (mm) */
  zinkenBreite: number;
  /** Schwalbenbreite = 2·T (mm) */
  schwalbeBreite: number;
  /** Konstruktionsmass der Schraege ZS = ratio·T (mm, nur Handzeichnung) */
  ZS: number;
  /** Schraege als Verhaeltnis 1:ratio (Lehrbuch: 1:6) */
  slopeRatio: number;
  /** Schraege in Grad (atan(1/ratio)); Lehrbuch nennt Spanne 10°–14°) */
  slopeDeg: number;
  /** Schwalbenlaenge (mm): offen = D, halbverdeckt = D − BL */
  SL: number;
  /** Randzinkenverstaerkung (nur Methode 2, mm) */
  RZV?: number;
  /** Restbreite nach Abzug der Raender (nur Methode 2, mm) */
  RB?: number;
  /** Breite einer Zinkenteilung (nur Methode 2, mm) */
  ZT?: number;
}

export interface ConstructionOptions {
  /**
   * Schwalbendichte. "dicht" = B/(1,7·D) (mehr/schmalere Schwalben, Lehrbuch-
   * Standardbeispiel), "weit" = B/(2·D) (weniger/breitere Schwalben).
   */
  dichte?: "dicht" | "weit";
  /** Schraege als 1:ratio. Default 6 (Lehrbuch). */
  slopeRatio?: number;
  /** Halbverdeckte Zinken: Blattanteil von D (1/4..1/3). Default offen (kein Blatt). */
  blattAnteil?: number;
}

const DEFAULT_SLOPE_RATIO = 6;

function degFromRatio(ratio: number): number {
  return Math.atan(1 / ratio) * (180 / Math.PI);
}

/** Schwalbenlaenge: offen = D, halbverdeckt = D − Blattstaerke (BL = anteil·D). */
function schwalbenLaenge(D: number, blattAnteil?: number): number {
  if (!blattAnteil || blattAnteil <= 0) return D;
  const BL = blattAnteil * D;
  return D - BL;
}

/**
 * Methode 1 — Geometrische Zinkenteilung auf der Mittellinie.
 *
 * AZS = B/(1,7·D) (geschaetzt, gerundet), AZT = AZS·3+1, T = B/AZT,
 * Zinken = 1T, Schwalbe = 2T, Schraege ZS = ratio·T.
 *
 * Lehrbuch-Referenz B=140, D=20 → AZS_raw≈4,12 → AZS=4, AZT=13, T≈10,77.
 */
export function method1Mittellinie(
  B: number,
  D: number,
  opts: ConstructionOptions = {},
): DovetailLayout {
  const faktor = opts.dichte === "weit" ? 2 : 1.7;
  const slopeRatio = opts.slopeRatio ?? DEFAULT_SLOPE_RATIO;

  const AZS_raw = B / (faktor * D);
  const AZS = Math.max(1, Math.round(AZS_raw));
  const AZT = AZS * 3 + 1;
  const T = B / AZT;
  const ZS = slopeRatio * T;

  return {
    method: "mittellinie",
    B,
    D,
    AZS_raw,
    AZS,
    AZT,
    T,
    zinkenBreite: T,
    schwalbeBreite: 2 * T,
    ZS,
    slopeRatio,
    slopeDeg: degFromRatio(slopeRatio),
    SL: schwalbenLaenge(D, opts.blattAnteil),
  };
}

/**
 * Methode 2 — Zinkenteilung ueber Randzinkenverstaerkung.
 *
 * RZV = D/3 (auf 0,5mm gerundet), RB = B − 2·RZV, AZS = RB/(1,7·D),
 * ZT = RB/AZS. Kraeftigere Randzinken.
 *
 * Lehrbuch-Referenz B=140, D=20 → RZV≈6,5, RB=127, AZS≈3,7→4, ZT≈31,8.
 */
export function method2Randverstaerkung(
  B: number,
  D: number,
  opts: ConstructionOptions = {},
): DovetailLayout {
  const faktor = opts.dichte === "weit" ? 2 : 1.7;
  const slopeRatio = opts.slopeRatio ?? DEFAULT_SLOPE_RATIO;

  // RZV = D/3, beim Aufreissen am Werkstueck auf 0,5mm gerundet (Lehrbuch: 6→6,5).
  const RZV = Math.round((D / 3) * 2) / 2;
  const RB = B - 2 * RZV;
  const AZS_raw = RB / (faktor * D);
  const AZS = Math.max(1, Math.round(AZS_raw));
  const ZT = RB / AZS;
  // Innerhalb einer Zinkenteilung gilt weiter Zinken:Schwalbe = 1:2.
  const T = ZT / 3;

  return {
    method: "randverstaerkung",
    B,
    D,
    AZS_raw,
    AZS,
    AZT: AZS * 3 + 1,
    T,
    zinkenBreite: T,
    schwalbeBreite: 2 * T,
    ZS: slopeRatio * T,
    slopeRatio,
    slopeDeg: degFromRatio(slopeRatio),
    SL: schwalbenLaenge(D, opts.blattAnteil),
    RZV,
    RB,
    ZT,
  };
}

/**
 * Methode 3 — Ungerade Teile auf der Grundlinie.
 *
 * AZT = B/SL, auf die naechste UNGERADE Zahl gerundet, T = B/AZT.
 * Durch abwechselnde Ausbildung entstehen Zinken und Schwalben.
 *
 * Lehrbuch-Referenz B=140, D=20 (SL=20) → AZT = 7 (ungerade), T = 20.
 */
export function method3Grundlinie(
  B: number,
  D: number,
  opts: ConstructionOptions = {},
): DovetailLayout {
  const slopeRatio = opts.slopeRatio ?? DEFAULT_SLOPE_RATIO;
  const SL = schwalbenLaenge(D, opts.blattAnteil);

  const AZT_raw = B / SL;
  const AZT = nearestOdd(AZT_raw);
  const T = B / AZT;
  // Bei Grundlinienteilung ist AZS implizit (Zinken/Schwalben wechseln sich ab).
  const AZS = Math.max(1, Math.floor(AZT / 2));

  return {
    method: "grundlinie",
    B,
    D,
    AZS_raw: AZT_raw,
    AZS,
    AZT,
    T,
    zinkenBreite: T,
    schwalbeBreite: T,
    ZS: slopeRatio * T,
    slopeRatio,
    slopeDeg: degFromRatio(slopeRatio),
    SL,
  };
}

/** Naechste ungerade Ganzzahl (>=1). 7→7, 7,78→9, 6→7? Lehrbuch: auf-/abrunden auf ungerade. */
export function nearestOdd(x: number): number {
  const r = Math.round(x);
  if (r % 2 === 1) return Math.max(1, r);
  // gerade → zur naeheren ungeraden Zahl (Abstand entscheidet, sonst aufrunden)
  const up = r + 1;
  const down = r - 1;
  if (down < 1) return up;
  // Bei Gleichstand die feinere (groessere) Teilung — meist die schoenere Optik.
  return x - down < up - x ? down : up;
}

/** Dispatcher: liefert das Layout fuer die gewaehlte Methode. */
export function computeDovetailLayout(
  B: number,
  D: number,
  method: DovetailMethod = "mittellinie",
  opts: ConstructionOptions = {},
): DovetailLayout {
  switch (method) {
    case "randverstaerkung":
      return method2Randverstaerkung(B, D, opts);
    case "grundlinie":
      return method3Grundlinie(B, D, opts);
    case "mittellinie":
    default:
      return method1Mittellinie(B, D, opts);
  }
}
