import type { DovetailStep } from "@craft-codex/core";
import type { AnrissLayer } from "../../components/AnrissFlat";

/**
 * Zinken-Lehrgang für den absoluten Anfänger — Datenvertrag.
 *
 * Sechs fachliche Schritte (Holz → Aufteilung → Anreißen → Sägen → Stemmen →
 * Übertragen/Passen/Verleimen). Die Vier-Stufen-Methode steckt INNERHALB jedes
 * Schritts (vorbereiten = Ziel/Werkzeug, vormachen = Animation + Meister-
 * Kommentar, nachmachen = Anleitung, üben = Kontrollpunkt + Fragen). Die
 * Hilfestufen (2 = alles, 1 = Stichworte, 0 = nur Ziel + Kontrollpunkt) sind
 * das Ausblenden (Fading) der Cognitive Apprenticeship.
 *
 * Inhalt in eigenen Worten. Rechenregel nach österreichischem Fachkunde-
 * Lehrbuch Tischler, Kap. 4.1 Zinkenverbindungen — TODO(Bernhard): Titel/Verlag.
 */

export type SchrittId =
  | "holz"
  | "aufteilung"
  | "anreissen"
  | "saegen"
  | "stemmen"
  | "passen";

export const SCHRITT_IDS: readonly SchrittId[] = [
  "holz",
  "aufteilung",
  "anreissen",
  "saegen",
  "stemmen",
  "passen",
] as const;

/** Ein Handgriff der Nachmachen-Anleitung: kurz (Stufe 1) und ausführlich (Stufe 2). */
export interface Handgriff {
  kurz: string;
  lang: string;
}

export interface Fehlerbild {
  fehler: string;
  ursache: string;
  abhilfe: string;
}

export interface Kontrollfrage {
  id: string;
  frage: string;
  antworten: readonly string[];
  /** Index der richtigen Antwort. */
  richtig: number;
  /** Rückmeldung nach der Antwort — erklärt WARUM (Feedback auf Aufgabenebene). */
  erklaerung: string;
}

/** Was die 3D-Bühne in diesem Schritt zeigt. */
export interface SchrittSzene {
  step: DovetailStep;
  anrissLayers: readonly AnrissLayer[];
  /** Arbeitsgang-Animation (Sägeschnitte / Ausstemmen) statt nur Anriss. */
  arbeitsgang?: "saegen" | "stemmen" | "passen";
}

export interface LehrgangSchritt {
  id: SchrittId;
  nr: number;
  titel: string;
  /** Ein Satz: was kann der Lehrling nach diesem Schritt? */
  ziel: string;
  werkzeug: readonly string[];
  /** Meister-Kommentar beim Vormachen (laut gedacht, Modeling). */
  vormachen: readonly string[];
  nachmachen: readonly Handgriff[];
  /** Woran merkst du, dass es passt? Beobachtbar, prüfbar. */
  kontrollpunkt: readonly string[];
  fehler: readonly Fehlerbild[];
  sicherheit: readonly string[];
  fragen: readonly Kontrollfrage[];
  szene: SchrittSzene;
}

export type Hilfestufe = 0 | 1 | 2;
