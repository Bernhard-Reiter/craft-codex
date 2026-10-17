import type { DovetailStep } from "@craft-codex/core";
import type { AnrissLayer } from "../../components/AnrissFlat";
import type { KapitelId, SchrittId } from "./kapitel";

/**
 * Zinken-Lehrgang für den absoluten Anfänger — Datenvertrag.
 *
 * Die Einträge folgen der EINEN Kapitel-Liste (kapitel.ts, neun Kapitel):
 * warum, anzeichnen und kontrolle sind je ein Kapitel; saegen, stemmen und
 * passen fassen als Entwurf noch mehrere Kapitel zusammen. Ids und
 * Reihenfolge kommen aus kapitel.ts, hier steht keine eigene Liste.
 * Die Vier-Stufen-Methode steckt INNERHALB jedes
 * Schritts (vorbereiten = Ziel/Werkzeug, vormachen = Animation + Meister-
 * Kommentar, nachmachen = Anleitung, üben = Kontrollpunkt + Fragen). Die
 * Hilfestufen (2 = alles, 1 = Stichworte, 0 = nur Ziel + Kontrollpunkt) sind
 * das Ausblenden (Fading) der Cognitive Apprenticeship.
 *
 * Inhalt in eigenen Worten. Rechenregel nach österreichischem Fachkunde-
 * Lehrbuch Tischler, Kap. 4.1 Zinkenverbindungen — TODO(Bernhard): Titel/Verlag.
 */

export type { KapitelId, SchrittId } from "./kapitel";
export { SCHRITT_IDS } from "./kapitel";

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
  /** Nummer des ersten Kapitels dieses Eintrags (kapitel.ts). */
  nr: number;
  /** Kapitel, die dieser Eintrag abdeckt — genau LEHRGANG_GRUPPEN[id]. */
  kapitel: readonly KapitelId[];
  titel: string;
  /** Sichtbarer Hinweis zum Eintrag (z. B. Stand des Rechners, »Entwurf«). DE und EN gleich gesetzt. */
  hinweis?: string;
  /** Zweiter Weg neben dem Lehrweg (z. B. Werkstattweg). DE und EN gleich gesetzt. */
  variante?: string;
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
