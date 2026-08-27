/**
 * Beschlag-Domänenmodell — Bohrbilder für die geführte Montage.
 *
 * Framework-agnostisch: reine Zahlen, kein three.js, kein React.
 * ALLE Längen in MILLIMETERN. Die Umrechnung nach Meter passiert erst im
 * Renderer (SCALE_MM_TO_M), damit die Werte hier 1:1 den Herstellerangaben
 * entsprechen und gegen die Vorlage prüfbar bleiben.
 */

/**
 * Anschlagsrichtung des Beschlags.
 *
 * SICHERHEITSRELEVANT: Das Bohrbild spiegelt bei der Gegenrichtung
 * vollständig. Ein Bohrbild ohne Anschlagsangabe ist unbrauchbar — wer die
 * falsche Richtung verbaut, bohrt spiegelverkehrt. Deshalb Pflichtfeld,
 * nicht optional.
 */
export type Anschlag = "links" | "rechts";

/**
 * Bezugssystem am Werkstück, in dem Koordinaten gelten.
 *
 * Konvention für `door.faceA.topLeft` (das einzige Frame im Durchstich):
 *   Ursprung = obere linke Ecke der zu bearbeitenden Türblattfläche
 *   +x       = nach rechts, entlang der Oberkante
 *   +y       = nach unten, entlang der linken Kante
 *   Fläche A = die Seite, in die gebohrt wird (Beschlagseite)
 *
 * Weitere Frames (z. B. `carcass.left.front` für die Schienenmontage) sind
 * vorgesehen, im Durchstich aber nicht registriert.
 */
export type FrameId = string;

/**
 * Kante, von der aus `y` gemessen wird.
 *
 * Beschlag-Bohrbilder bemaßen die oberen Bohrungen ab Oberkante und die
 * unteren ab Unterkante — die Türhöhe ist variabel, die Abstände zu den
 * Kanten sind es nicht. Ein einziger Ursprung für alle Bohrungen wäre bei
 * jeder abweichenden Türhöhe falsch.
 */
export type YRef = "oberkante" | "unterkante";

/** Eine Bohrung auf einer Bezugsfläche. */
export interface DrillPoint {
  /** Eindeutig innerhalb des Layouts. */
  id: string;
  /** Bezugsfläche, in der x/y gelten. */
  frame: FrameId;
  /** Abstand von der linken Kante entlang +x, in mm. */
  x: number;
  /** Abstand von der in `yRef` genannten Kante, in mm (immer positiv). */
  y: number;
  /** Kante, ab der `y` gemessen wird. */
  yRef: YRef;
  /** Bohrerdurchmesser in mm. */
  diameter: number;
  /** Bohrtiefe in mm. Durchgangsbohrung = Werkstückdicke. */
  depth: number;
  /** Werkzeugbezeichnung, wie sie dem Tischler angezeigt wird. */
  tool: string;
  /** Schritt der WorkflowDefinition, in dem diese Bohrung sichtbar ist. */
  stepId: string;
  /**
   * Offene fachliche Frage zu dieser Bohrung, im Klartext.
   *
   * Gesetzt, solange ein Maß aus der Vorlage nicht zweifelsfrei zugeordnet
   * werden konnte. Ein Layout mit auch nur einer offenen Bohrung kann den
   * Status "geprueft" nicht erreichen — siehe validateLayout(). Damit kann
   * eine unsichere Ableitung nicht versehentlich als gesichert durchgehen.
   */
  offen?: string;
}

/**
 * Ein Einzelmaß innerhalb einer Maßkette.
 *
 * `toPointId` bindet das Maß an eine Bohrung; fehlt es, misst das Segment auf
 * eine Hilfslinie oder die gegenüberliegende Kante.
 */
export interface ChainSegment {
  /** Anzeigetext, z. B. "113". */
  label: string;
  /** Exakter Wert in mm — NIE gerundet weiterrechnen. */
  value: number;
  /** Bohrung, auf die dieses Segment misst (optional). */
  toPointId?: string;
}

/**
 * Eine geschlossene Maßkette entlang einer Achse.
 *
 * Zweck ist nicht Dekoration, sondern Prüfbarkeit in zwei Richtungen:
 *
 *  1. Der Tischler sieht die Maße im Headset neben den Bohrpunkten und kann
 *     sie mit dem Maßband nachmessen. Stimmt die Registrierung nicht, fällt
 *     es sofort auf.
 *  2. Der Validator prüft, ob die Summe der Segmente das Gesamtmaß ergibt.
 *     Ein Zahlendreher beim Digitalisieren fliegt damit im Build auf, nicht
 *     erst an der Werkbank.
 */
export interface DimensionChain {
  id: string;
  /** Achse, entlang der gemessen wird. */
  axis: "x" | "y";
  /** Bezugskante, ab der die Kette startet (Klartext für die Anzeige). */
  from: string;
  /** Die Einzelmaße in Messreihenfolge. */
  segments: ChainSegment[];
  /**
   * Gesamtmaß der Kette in mm. Die Summe der Segmente muss diesen Wert
   * ergeben — siehe validateLayout().
   */
  total: number;
}

/**
 * Herkunft des Bohrbilds.
 *
 * Wird dem Tischler am Maß angezeigt, damit er im Zweifel selbst nachschlagen
 * kann — und damit sichtbar ist, für welche Produktvariante die Zahlen gelten.
 */
export interface LayoutSource {
  /** Dokumentnummer der Montageanleitung, z. B. "788.2000.310". */
  document: string;
  /** Seite darin, auf der das Bohrbild steht. */
  page: number;
  /** Optionale Zweitquelle zur Gegenprüfung, z. B. "Häfele DGH-M2022 S. 10.138". */
  crosscheck?: string;
}

/**
 * Prüfstand eines Bohrbilds.
 *
 * "entwurf"   Aus der Herstellervorlage abgeleitet, fachlich NICHT bestätigt.
 *             Der Renderer zeigt in diesem Zustand die Maßketten zum
 *             Nachmessen, aber KEINE Bohrpunkte — ein Punkt im Headset sieht
 *             verbindlich aus, ein Maß lädt zum Prüfen ein.
 * "geprueft"  Von einem Fachkundigen gegen Vorlage und reales Werkstück
 *             geprüft. Erst dann dürfen Bohrpunkte gerendert werden.
 *
 * Der Übergang ist eine menschliche Entscheidung, kein Rechenergebnis.
 */
export type LayoutStatus = "entwurf" | "geprueft";

/** Das vollständige Bohrbild eines Beschlags für eine Anschlagsrichtung. */
export interface HardwareLayout {
  id: string;
  /** Prüfstand — steuert, ob Bohrpunkte gerendert werden dürfen. */
  status: LayoutStatus;
  /** Anzeigename inklusive Produktvariante. */
  label: string;
  /** Artikelbezeichnung des Herstellers, z. B. "Hawa Combino 65/80 H FS ul". */
  article: string;
  /** Für welche Anschlagsrichtung diese Koordinaten gelten. */
  anschlag: Anschlag;
  /** Breite der bearbeiteten Fläche in mm — Spiegelachse für mirrorLayout(). */
  faceWidth: number;
  source: LayoutSource;
  points: DrillPoint[];
  chains: DimensionChain[];
}
