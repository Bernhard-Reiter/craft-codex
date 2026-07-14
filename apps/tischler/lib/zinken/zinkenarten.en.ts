/**
 * Zinken — Lernpfad-Datenmodell, ENGLISCHER Zwilling von zinkenarten.ts.
 *
 * Struktur, IDs, order, schwierigkeit, playable und hrefs identisch zur
 * deutschen Quelle; NUR die sichtbaren Texte sind ins Englische übersetzt
 * (US English, Glossar docs/i18n/GLOSSARY.md: Schwalben=tails, Zinken=pins,
 * Randzinken=half pins, Königsdisziplin=the crowning discipline).
 * Typen kommen aus zinkenarten.ts — Struktur-Gleichheit compiler-erzwungen.
 *
 * ⚠️ voiceIntro = TTS-Cache-Key: für EN existiert noch kein vorvertonter
 * Cache — bei EN-Stimme zuerst Cache bauen, danach Wortlaut stabil halten.
 *
 * RIS_ANKER_EN: Das amtliche Zitat bleibt bewusst im deutschen Original
 * (Rechtstext, wörtlich belegt — Übersetzung würde die Beleg-Funktion
 * zerstören); nur die beschreibenden Titel sind englisch ergänzt.
 */

import type { Zinkenart } from "./zinkenarten";
import type {
  ZINKEN_GESCHICHTE,
  ZINKEN_ANWENDUNGEN,
} from "./zinkenarten";

export const ZINKENARTEN_EN: readonly Zinkenart[] = [
  {
    id: "fingerzinken",
    order: 1,
    name: "Finger joint",
    kurz: "Straight pins — the easiest way in.",
    was: "Straight, square pins that interlock like fingers of equal width. No undercut — the joint relies on glue.",
    wann: "The first exercise in an apprenticeship, and the choice for production work (machine, jig). Drawers, boxes, quick sturdy corners.",
    schwierigkeit: 1,
    playable: false,
    voiceIntro:
      "Let's start simple. Finger joints are straight — like fingers interlocking. They hold with glue, and they're the best first step.",
  },
  {
    id: "offener-schwalbenschwanz",
    order: 2,
    name: "Through dovetail",
    kurz: "The crowning discipline — visible, cut by hand.",
    was: "Wedge-shaped tails with an undercut. The dovetail shape locks the corner, so it holds against pull even without glue.",
    wann: "The classic training and master exercise. Visible corners on boxes, chests, and drawer backs, where the interlocking pattern doubles as decoration.",
    schwierigkeit: 2,
    playable: true,
    href: "/werkstatt",
    voiceIntro:
      "Now for the crowning discipline. The dovetail is wedge-shaped — it locks itself in and holds without glue. We'll build it step by step: lay out, saw, chop, fit, check.",
  },
  {
    id: "halbverdeckt",
    order: 3,
    name: "Half-blind dovetail",
    kurz: "The drawer standard — clean up front.",
    was: "A half-blind dovetail: from the show side you see no end grain — the tails stop blind inside the wood.",
    wann: "The standard for drawer fronts — the front stays clean and handsome on the outside, while the drawer side is dovetailed in solidly.",
    schwierigkeit: 3,
    playable: false,
    voiceIntro:
      "On a drawer, you don't want to see the joint from the front. That's what the half-blind dovetail is for: the front stays clean, and the side still holds rock solid.",
  },
  {
    id: "verdeckt-gehrung",
    order: 4,
    name: "Secret mitered dovetail",
    kurz: "The masterpiece — the corner disappears.",
    was: "Nothing shows from either outside face — the corner looks like a plain miter, but hides a full dovetail joint inside.",
    wann: "The finest and most demanding variant: fine furniture, jewelry boxes, visible carcass corners where the joinery should disappear completely.",
    schwierigkeit: 3,
    playable: false,
    voiceIntro:
      "This is the high art. With the secret mitered dovetail you see nothing at all from the outside — the corner looks like a clean miter joint, but holds like a dovetail.",
  },
] as const;

/** Geschichte als Mini-Timeline (für den Überblick) — EN. */
export const ZINKEN_GESCHICHTE_EN: typeof ZINKEN_GESCHICHTE = [
  {
    epoche: "Ancient Egypt",
    text: "Dovetail-like joints already appear in furniture from Tutankhamun's tomb — over 3,000 years old.",
  },
  {
    epoche: "15th century",
    text: "Refined by European craftsmen into a whole system of wood joints.",
  },
  {
    epoche: "Today",
    text: "The hand-cut dovetail is considered the crowning discipline of corner joinery — and the true test of skill.",
  },
];

/** Wofür — Anwendungen als Chips — EN. */
export const ZINKEN_ANWENDUNGEN_EN: typeof ZINKEN_ANWENDUNGEN = [
  "Drawers",
  "Chests & boxes",
  "Jewelry boxes",
  "Tool chests",
  "Carcass corners",
  "Musical instruments",
];

/**
 * Der amtliche Anker (RIS) — Zitat bleibt deutsches Original (wörtlich
 * belegt, §7 UrhG); Titel englisch mit deutschem Amtsnamen in Klammern.
 */
export const RIS_ANKER_EN = {
  ausbildungsordnung: {
    gesetzesnummer: "20011991",
    titel: "Cabinetmaking Training Regulation (Tischlerei-Ausbildungsordnung)",
    zitat:
      "lösbare und unlösbare Verbindungen herstellen, insbesondere … Zinkenverbindungen … / Werkstücke bearbeiten, insbesondere Messen, Anreißen, … Sägen, Stemmen",
    url: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011991",
  },
  lehrplan: {
    gesetzesnummer: "20009625",
    titel:
      "Vocational School Curriculum, Annex 147 — Cabinetmaking (Berufsschul-Lehrplan, Anlage 147)",
    zitat: "Hirnholzbearbeitung · Holzverbindungen fachgerecht erstellen",
  },
} as const;

export function getZinkenartByIdEn(id: string): Zinkenart | undefined {
  return ZINKENARTEN_EN.find((z) => z.id === id);
}

/** Zinkenarten in Lernreihenfolge (order aufsteigend) — EN. */
export function getLernpfadEn(): readonly Zinkenart[] {
  return [...ZINKENARTEN_EN].sort((a, b) => a.order - b.order);
}

/** Die erste spielbare Art — der empfohlene Hands-on-Einstieg — EN. */
export function getFirstPlayableEn(): Zinkenart | undefined {
  return getLernpfadEn().find((z) => z.playable);
}
