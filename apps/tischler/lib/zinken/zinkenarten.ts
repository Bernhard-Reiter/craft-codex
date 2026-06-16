/**
 * Zinken — Lernpfad-Datenmodell (Single Source of Truth).
 *
 * Treibt die Überblick-/Lernpfad-Seite, den Zinkenart-Auswahl-Schritt und die
 * Meister-Stimme. Framework-agnostisch (kein React) — damit testbar und auch
 * von der Voice-Schicht / XR nutzbar.
 *
 * Reihenfolge = didaktische Empfehlung (vom Einfachen zum Meisterstück). Der
 * AMTLICHE Rahmen (RIS) schreibt die Kompetenzen "Anreißen" und
 * "Zinkenverbindungen" verbindlich vor — die *innere* Lernreihenfolge der
 * Zinkenarten ist Handwerks-Didaktik, nicht Gesetzeswortlaut. Genau so wird
 * sie im Pitch ehrlich dargestellt: RIS = Pflicht, Reihenfolge = Empfehlung.
 */

export type ZinkenartId =
  | "fingerzinken"
  | "offener-schwalbenschwanz"
  | "halbverdeckt"
  | "verdeckt-gehrung";

export interface Zinkenart {
  id: ZinkenartId;
  /** Position im Lernpfad (1-basiert) */
  order: number;
  name: string;
  /** Ein-Zeilen-Kurzform für Karten */
  kurz: string;
  /** Was ist das — in Laiensprache */
  was: string;
  /** Wofür / wann nimmt man sie */
  wann: string;
  /** Schwierigkeit 1–3 (für die Difficulty-Punkte) */
  schwierigkeit: 1 | 2 | 3;
  /**
   * Spielbar = es gibt das interaktive 3D-Werkstück + die fünf Handschritte.
   * Aktuell nur der offene Schwalbenschwanz (vorhandene Geometrie). Die
   * anderen werden erklärt (Stimme + Text), die Werkstatt folgt.
   */
  playable: boolean;
  /** Route in die Hands-on-Werkstatt (nur wenn playable) */
  href?: string;
  /**
   * Was der Meister spricht, wenn man die Art auswählt. Warm, kurz, in der
   * Sprache der Werkstatt. ⚠️ Wortlaut = TTS-Cache-Key (build-tts-cache.mjs) —
   * nicht beiläufig umformulieren, sonst greift die vorvertonte Stimme nicht.
   */
  voiceIntro: string;
}

export const ZINKENARTEN: readonly Zinkenart[] = [
  {
    id: "fingerzinken",
    order: 1,
    name: "Fingerzinken",
    kurz: "Gerade Zinken — der einfachste Einstieg.",
    was: "Gerade, rechtwinklige Zinken, die wie gleich breite Finger ineinandergreifen. Kein Hinterschnitt — die Verbindung wird verleimt.",
    wann: "Erste Übung in der Lehre und für die Serienfertigung (Maschine, Schablone). Schubladen, Kisten, schnelle stabile Ecken.",
    schwierigkeit: 1,
    playable: false,
    voiceIntro:
      "Fangen wir einfach an. Fingerzinken sind gerade — wie Finger, die ineinandergreifen. Sie halten mit Leim und sind der beste erste Schritt.",
  },
  {
    id: "offener-schwalbenschwanz",
    order: 2,
    name: "Offener Schwalbenschwanz",
    kurz: "Die Königsdisziplin — sichtbar, von Hand.",
    was: "Keilförmige Zinken mit Hinterschnitt. Durch die Schwalbenschwanz-Form verriegelt sich die Ecke und hält sogar ohne Leim auf Zug.",
    wann: "Die klassische Lern- und Meisterübung. Sichtbare Ecken an Kisten, Truhen, Schubladenrückwänden, wo die Verzahnung auch als Zierde wirkt.",
    schwierigkeit: 2,
    playable: true,
    href: "/werkstatt",
    voiceIntro:
      "Jetzt die Königsdisziplin. Der Schwalbenschwanz ist keilförmig — er verhakt sich und hält ohne Leim. Wir bauen ihn Schritt für Schritt: anreißen, sägen, stemmen, passen, prüfen.",
  },
  {
    id: "halbverdeckt",
    order: 3,
    name: "Halbverdeckte Zinkung",
    kurz: "Der Schubladen-Standard — vorne glatt.",
    was: "Ein halbverdeckter Schwalbenschwanz: von der Schauseite sieht man kein Hirnholz, die Zinken enden blind im Holz.",
    wann: "Der Standard für Schubladenfronten — die Front bleibt außen glatt und schön, die Seitenwand ist fest eingezinkt.",
    schwierigkeit: 3,
    playable: false,
    voiceIntro:
      "Bei der Schublade soll man die Verbindung vorne nicht sehen. Darum die halbverdeckte Zinkung: die Front bleibt glatt, und trotzdem hält die Seite bombenfest.",
  },
  {
    id: "verdeckt-gehrung",
    order: 4,
    name: "Verdeckte Zinkung auf Gehrung",
    kurz: "Das Meisterstück — die Ecke verschwindet.",
    was: "Von beiden Außenseiten ist nichts zu sehen — die Ecke wirkt wie eine reine Gehrung, versteckt aber innen eine volle Zinkenverbindung.",
    wann: "Die edelste, aufwändigste Variante: hochwertige Möbel, Schatullen, sichtbare Korpusecken, an denen die Konstruktion ganz verschwinden soll.",
    schwierigkeit: 3,
    playable: false,
    voiceIntro:
      "Die hohe Schule. Bei der verdeckten Zinkung auf Gehrung sieht man von außen gar nichts mehr — die Ecke wirkt wie ein glatter Gehrungsstoß, hält aber wie ein Schwalbenschwanz.",
  },
] as const;

/** Geschichte als Mini-Timeline (für den Überblick). */
export const ZINKEN_GESCHICHTE: ReadonlyArray<{ epoche: string; text: string }> =
  [
    {
      epoche: "Altes Ägypten",
      text: "Zinkenartige Verbindungen finden sich schon in Möbeln aus dem Grab des Tutanchamun — über 3000 Jahre alt.",
    },
    {
      epoche: "15. Jahrhundert",
      text: "Im europäischen Handwerk zu einem ganzen System von Holzverbindungen verfeinert.",
    },
    {
      epoche: "Heute",
      text: "Die von Hand gearbeitete Schwalbenschwanzzinkung gilt als Königsdisziplin der Eckverbindung — und als Prüfstein des Könnens.",
    },
  ];

/** Wofür — Anwendungen als Chips. */
export const ZINKEN_ANWENDUNGEN: ReadonlyArray<string> = [
  "Schubladen",
  "Truhen & Kisten",
  "Schatullen",
  "Werkzeugkästen",
  "Korpusecken",
  "Musikinstrumente",
];

/**
 * Der amtliche Anker (RIS) — wörtlich belegt, für den Pitch.
 * Quelle liegt vollständig im ris-corpus (RIS-OGD, §7 UrhG gemeinfrei).
 */
export const RIS_ANKER = {
  ausbildungsordnung: {
    gesetzesnummer: "20011991",
    titel: "Tischlerei-Ausbildungsordnung",
    zitat:
      "lösbare und unlösbare Verbindungen herstellen, insbesondere … Zinkenverbindungen … / Werkstücke bearbeiten, insbesondere Messen, Anreißen, … Sägen, Stemmen",
    url: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
  },
  lehrplan: {
    gesetzesnummer: "20009625",
    titel: "Berufsschul-Lehrplan, Anlage 147 (Tischlerei)",
    zitat: "Hirnholzbearbeitung · Holzverbindungen fachgerecht erstellen",
  },
} as const;

export function getZinkenartById(id: string): Zinkenart | undefined {
  return ZINKENARTEN.find((z) => z.id === id);
}

/** Zinkenarten in Lernreihenfolge (order aufsteigend). */
export function getLernpfad(): readonly Zinkenart[] {
  return [...ZINKENARTEN].sort((a, b) => a.order - b.order);
}

/** Die erste spielbare Art — der empfohlene Hands-on-Einstieg. */
export function getFirstPlayable(): Zinkenart | undefined {
  return getLernpfad().find((z) => z.playable);
}
