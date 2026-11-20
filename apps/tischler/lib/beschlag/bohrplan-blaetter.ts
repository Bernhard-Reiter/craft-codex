/**
 * Bohrplan-Blätter zum Messe-Unterschrank (aus beschlag/bohrplan/page.tsx
 * verschoben, ohne Verhaltensänderung), damit Tests die echten Blätter prüfen
 * statt den Quelltext. Maße aus core, keine Preise.
 */

import {
  buildBlumClipTopTuerLayout,
  buildMesseBodenLayout,
  buildMesseHinterstueckLayout,
  buildMesseUnterschrankSeiteLayout,
  MESSE_UNTERSCHRANK,
  messeLochreihePunkte,
  type HardwareLayout,
} from "@craft-codex/core";

const M = MESSE_UNTERSCHRANK;

export type Blatt = {
  teil: string;
  /** Teilname wie in der Werkstatt-Mappe (cody-cad), steht im Blattkopf statt einer Pos.-Nummer. */
  name: string;
  breite: number;
  hoehe: number;
  layout: HardwareLayout;
  /** Beschlag-Zeile im Blattkopf ohne alten Teilnamen (Druck nennt das Teil nur wie die Mappe). */
  beschlag?: string;
  /** Annahme zum ganzen Blatt (orange), z. B. die Anzahl der Scharniere. */
  annahme?: string;
  /** Innenansicht gespiegelt: Vorderkante rechts im Bild (rechte Korpusseite). */
  gespiegelt?: boolean;
  /** Lochreihe (cody-cad) mitzeichnen: Punkte ohne Nummer, eine Zeile in der Tabelle. */
  lochreihe?: boolean;
  /** Bezugskante für y, wenn sie nicht Ober-/Unterkante heißt (Boden: Vorderkante unten im Blatt). */
  yAb?: string;
};

export const LOCHREIHE = messeLochreihePunkte();

const SEITE_LINKS = buildMesseUnterschrankSeiteLayout();

/**
 * Rechte Korpusseite = dieselben MOVENTO-Bohrungen wie links, ab Vorderkante
 * gemessen. Keine Montageplatten: die Tür schlägt links an. Keine neuen Maße.
 */
export const SEITE_RECHTS: HardwareLayout = {
  ...SEITE_LINKS,
  id: "messe-unterschrank-600--korpusseite-rechts",
  label: "Korpusseite rechts: MOVENTO 766H5000S (spiegelbildlich)",
  article: "Blum 766H5000S",
  points: SEITE_LINKS.points.filter((p) => p.id.startsWith("movento.")),
  chains: SEITE_LINKS.chains
    .filter((c) => c.axis === "x")
    .map((c) => ({ ...c, segments: [], total: 0 })),
};

// Breite aus dem Bohrbild selbst (A7): eine Quelle, sonst druckt das Blatt
// nach einer Kern-Änderung das alte Maß neben neuen Bohrungen.
const HINTERSTUECK = buildMesseHinterstueckLayout();
const BODEN = buildMesseBodenLayout();

export const BLAETTER: Blatt[] = [
  {
    teil: "Tür",
    name: "Tür 1 Links",
    breite: M.tuer.breite,
    hoehe: M.tuer.hoehe,
    layout: buildBlumClipTopTuerLayout(M.tuer.breite, M.tuer.hoehe),
    beschlag: "Blum CLIP top BLUMOTION 110°",
    annahme: M.annahmen[0],
  },
  {
    teil: "Seite",
    name: "Seite Links",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: SEITE_LINKS,
    beschlag: "Montageplatten 173L6100 + MOVENTO 766H5000S",
    lochreihe: true,
  },
  {
    teil: "Seite",
    name: "Seite Rechts",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: SEITE_RECHTS,
    beschlag: "MOVENTO 766H5000S (spiegelbildlich)",
    annahme:
      "Rechte Seite spiegelbildlich zur linken gezeichnet (Innenansicht, Vorderkante rechts im Bild). " +
      "Keine Montageplatten, weil die Tür links anschlägt.",
    gespiegelt: true,
    lochreihe: true,
  },
  {
    teil: "Hinterstück",
    name: "Schubkasten-Hinterstück",
    breite: HINTERSTUECK.faceWidth,
    hoehe: 121,
    layout: HINTERSTUECK,
  },
  {
    teil: "Boden",
    name: "Schubkasten-Boden",
    breite: BODEN.faceWidth,
    hoehe: 490,
    layout: BODEN,
    yAb: "Vorderkante",
  },
];
