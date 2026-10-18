import type { AnrissLayer } from "../../../components/AnrissFlat";

/**
 * Werkbank Stufe 1 (Kapitel Anreißen): die drei Schritte als Daten.
 * Text und 3D-Ansicht lesen denselben Schrittzustand (kamera, marker),
 * es gibt keine Kamerabefehle aus Freitext.
 * Die Sicherheitskarte kommt NICHT aus diesen Daten, sondern aus
 * lehrgang.ts (Sicherheitssätze) und messages/<sprache>/zinken.json (AR-Satz).
 */

export const WERKBANK_KAMERAS = ["draufsicht", "stirnseite", "schraeg"] as const;
export type WerkbankKamera = (typeof WERKBANK_KAMERAS)[number];

export type WerkbankSchrittId = "bezugsflaeche" | "grundlinie" | "pruefen";

/** Hilfestufen in fester Reihenfolge; erklaerung nur auf Wunsch. */
export interface WerkbankHilfen {
  beobachten: string;
  hinweis: string;
  teilschritt: string;
  erklaerung: string;
}

export interface WerkbankSchritt {
  id: WerkbankSchrittId;
  /** höchstens 2 Sätze */
  kurz: string;
  /** genau ein Handgriff, ein Satz */
  handgriff: string;
  kamera: WerkbankKamera;
  /** sichtbare Anrisslinien in der Werkstückansicht */
  marker: readonly AnrissLayer[];
  /** »Woran du's prüfst«: 1–3 sichtbare Kriterien */
  kriterien: readonly string[];
  warum: string;
  /** IDs aus dem Lehrgang-Korpus (getZinkenLehrgangCorpus) */
  quellen: readonly string[];
  hilfen: WerkbankHilfen;
  /** true = die feste Sicherheitskarte steht vor diesem Schritt */
  sicherheit?: true;
}

/** S1 ROT: Platzhalter, die drei Schritte kommen mit dem nächsten Commit. */
export const WERKBANK_SCHRITTE_DE: readonly WerkbankSchritt[] = [];
