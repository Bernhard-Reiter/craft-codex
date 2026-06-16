/**
 * Geometry-Types für Holzverbindungen.
 * Framework-agnostisch — keine Three.js-Imports hier.
 */

export interface DovetailParams {
  /** Brettstärke in mm (Default 20) */
  thickness_mm: number;
  /** Brettbreite in mm (Default 100) */
  width_mm: number;
  /** Brettlänge in mm (Default 200) */
  length_mm: number;
  /** Anzahl Schwalbenschwanz-Pins */
  pinCount: number;
  /** Schwalbenschwanz-Ratio (z.B. 6 für 1:6) */
  ratio: number;
  /** Verteilung der Pins über die Brettbreite */
  distribution: "uniform" | "asymmetric_left" | "asymmetric_right";
}

/**
 * Lernschritte. "ueberblick" ist Schritt 0 — die Verbindung wird ERKLAERT
 * (fertiges Werkstueck, keine Anrisslinien) bevor die Handarbeit beginnt.
 * Ein Laie soll nie mit nackten Strichen starten. generateMarkings() liefert
 * fuer "ueberblick" bewusst keine Linien.
 */
export type DovetailStep =
  | "ueberblick"
  | "anreissen"
  | "saegen"
  | "stemmen"
  | "passen"
  | "pruefen";

export interface MarkingLine {
  id: string;
  /** Beschreibung für Lehrling (DE) */
  description: string;
  /** Hex-Color für Hologramm-Overlay */
  color: string;
  /** Punkt-Folge im lokalen Koordinatensystem (mm) */
  points: Array<[number, number, number]>;
}

export interface DovetailGeometryResult<TMesh = unknown, TLine = unknown> {
  boardA: TMesh;
  boardB: TMesh;
  markings: TLine[];
}

export const DEFAULT_DOVETAIL_PARAMS: DovetailParams = {
  thickness_mm: 20,
  width_mm: 100,
  length_mm: 200,
  pinCount: 5,
  ratio: 6,
  distribution: "uniform",
};
