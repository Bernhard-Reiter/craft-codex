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

/** Kapitel Anreißen, die drei Schritte der Werkbank (Stufe 1). */
export const WERKBANK_SCHRITTE_DE: readonly WerkbankSchritt[] = [
  {
    id: "bezugsflaeche",
    kurz: "Leg fest, welche Seite außen sitzt, und kennzeichne sie. Von dieser Fläche aus reißt du später alles an.",
    handgriff: "Schreib AUSSEN auf die Außenseite und zieh das Tischlerdreieck über die Kanten beider Bretter.",
    kamera: "draufsicht",
    marker: ["baseline"],
    kriterien: [
      "AUSSEN steht auf der Außenseite jedes Bretts.",
      "Das Tischlerdreieck läuft über die Kanten aller Teile in dieselbe Richtung.",
      "An jeder Ecke steht auf beiden Teilen dieselbe Nummer.",
    ],
    warum: "Ohne markierte Außenseite spannst du das Brett leicht verkehrt ein, dann werden die Zinken gespiegelt und sitzen außen breit.",
    quellen: ["lehrgang-anzeichnen-arbeitsschritt", "lehrgang-anzeichnen-fehler-1"],
    hilfen: {
      beobachten: "Was siehst du an deiner Bezugsfläche, bevor du irgendetwas anreißt?",
      hinweis: "Die Außenseite ist die Fläche, die später zu sehen ist. Liegen die Jahrringe flach, ist das die Kernseite.",
      teilschritt: "Prüf zuerst, ob beide Bretter gleich dick und gleich breit sind und das Hirnholz rechtwinklig ist.",
      erklaerung: "Schreib AUSSEN auf die Außenseite, zieh das Tischlerdreieck über die Kanten aller Teile und schreib an jede Ecke auf beide Teile dieselbe Nummer. Damit kannst du Außen- und Innenseite nicht mehr verwechseln.",
    },
  },
  {
    id: "grundlinie",
    kurz: "Reiß die Grundlinie mit dem Streichmaß auf Brettdicke an. Am Zinkenbrett nur auf den beiden Flächen, nicht über die Kanten.",
    handgriff: "Stell das Streichmaß am Gegenbrett ein, leg den Anschlag ans Hirnholz und reiß erst leicht, dann in derselben Spur kräftiger.",
    kamera: "schraeg",
    marker: ["baseline"],
    kriterien: [
      "Die Grundlinie steht auf beiden Flächen, aber nicht auf den Kanten.",
      "Sie ist einmal da, dünn und ohne zweite Spur.",
      "Ihr Abstand zum Hirnholz ist genau die Dicke des Gegenbretts.",
    ],
    warum: "Gerissen wird nur, wo gesägt und gestemmt wird, und ein Riss über der Kante bleibt später sichtbar.",
    quellen: [
      "lehrgang-anzeichnen-arbeitsschritt",
      "lehrgang-anzeichnen-fehler-2",
      "lehrgang-anzeichnen-fehler-3",
      "lehrgang-anzeichnen-sicherheit",
    ],
    hilfen: {
      beobachten: "Woran hast du dein Streichmaß eingestellt, an der Skala oder am Gegenbrett?",
      hinweis: "Der Anschlag liegt am Hirnholz und muss satt anliegen, sonst kippt er und die Linie wird doppelt oder schief.",
      teilschritt: "Stell das Streichmaß direkt am Gegenbrett ein und verstell es bis zum Schluss nicht mehr.",
      erklaerung: "Anschlag an die eine Fläche des Gegenbretts, Schneide genau an die andere. Dann am Zinkenbrett mit dem Anschlag am Hirnholz die Grundlinie nur auf beiden Flächen reißen, erst leicht, dann in derselben Spur kräftiger.",
    },
    sicherheit: true,
  },
  {
    id: "pruefen",
    kurz: "Prüf dein Brett, bevor du zur Säge greifst. Was jetzt nicht stimmt, korrigierst du später nicht mehr.",
    handgriff: "Halt den Stahlmaßstab ans Hirnholz und vergleich den Abstand der Grundlinie mit der Dicke des Gegenbretts.",
    kamera: "stirnseite",
    marker: ["baseline"],
    kriterien: [
      "Die Grundlinie liegt auf Brettdicke, gemessen vom Hirnholz.",
      "Sie steht nur auf den Flächen und läuft nicht über die Kanten.",
      "Sie ist durchgehend und sauber, einmal und dünn.",
    ],
    warum: "Die Grundlinie ist die Grenze für Säge und Stemmeisen, ein Fehler hier zieht sich durch jeden weiteren Schnitt.",
    quellen: [
      "lehrgang-anzeichnen-arbeitsschritt",
      "lehrgang-anzeichnen-fehler-2",
      "lehrgang-anzeichnen-fehler-3",
    ],
    hilfen: {
      beobachten: "Schau dir die Kanten deines Zinkenbretts an: Was siehst du dort?",
      hinweis: "An den Kanten darf keine Linie sein, auf den Flächen genau eine.",
      teilschritt: "Miss zuerst an beiden Flächen den Abstand der Grundlinie zum Hirnholz.",
      erklaerung: "Richtig ist die Grundlinie, wenn sie auf beiden Flächen genau auf der Dicke des Gegenbretts liegt, einmal und dünn, und an den Kanten fehlt. Eine doppelte Spur kommt vom gekippten Anschlag oder vom verstellten Streichmaß.",
    },
  },
];
