import type { RAGDocument } from "@craft-codex/core";

/**
 * Zinken-KONSTRUKTIONS-Korpus — ENGLISCHER Zwilling von
 * dovetail-konstruktion-corpus.ts.
 *
 * Gleiche Dokument-IDs, gleiche topic-/source-/license-Keys; NUR text,
 * title und die beschreibende attribution sind ins Englische übersetzt
 * (US English, Glossar docs/i18n/GLOSSARY.md).
 *
 * Formel-Kürzel (B, D, AZS, AZT, T, ZS, RZV, RB, ZT, SL, BL) bleiben wie
 * auf der deutschen Werkstattzeichnung — das Begriffs-Dokument erklärt
 * sie inklusive deutscher Herkunft. Zahlen-FORMAT ist US-Locale
 * (Dezimalpunkt: "10.77 mm"), die WERTE sind unverändert.
 */

export const ZINKEN_KONSTRUKTION_CORPUS_EN: RAGDocument[] = [
  {
    id: "konstruktion-grundsystem",
    text:
      "The basic system of dovetail spacing — how the cabinetmaker thinks: " +
      "a dovetail row consists of pins (the narrow bridges) and tails (the " +
      "wide, wedge-shaped parts in between). The rule of thumb for a calm, " +
      "regular pattern: a pin is 1 part wide, a tail 2 parts. We call one " +
      "such part 'T'. So one full repeat is 1T + 2T = 3T. The tails should " +
      "look evenly spaced across the board width. The slope of the tail " +
      "(the angle of the wedge flank) runs 10 to 14 degrees, or expressed " +
      "as a ratio roughly 1:6. Steeper than 1:6 breaks out at the tips, " +
      "shallower holds worse against pull. Mnemonic for the apprentice: " +
      "pin narrow, tail twice as wide, slope one in six.",
    metadata: {
      source: "own-paraphrase",
      title: "Basic system — pin 1T, tail 2T, slope 1:6",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4 dovetail joints",
    },
  },
  {
    id: "konstruktion-begriffe",
    text:
      "The abbreviations of dovetail construction — the vocabulary on " +
      "every workshop drawing (they come from the German terms and are " +
      "kept as-is): B is the board width, D the board thickness. AZS is " +
      "the number of tails, AZT the number of layout parts. T is the width " +
      "of a single part. ZS is the construction measure of the slope (how " +
      "far the wedge drifts out over the tail length). RZV is the " +
      "reinforced half pin — a beefier bridge at the very edge. RB is the " +
      "remaining width, that is B minus the two edges. ZT is the width of " +
      "one full dovetail repeat. SL is the tail length (equal to the board " +
      "thickness D for through dovetails). BL is the lap thickness for " +
      "half-blind dovetails. Know these eleven abbreviations and you can " +
      "read any dovetail drawing.",
    metadata: {
      source: "own-paraphrase",
      title: "Terms & abbreviations (B, D, AZS, AZT, T, ZS, RZV, RB, SL, BL)",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4",
    },
  },
  {
    id: "konstruktion-mittellinie",
    text:
      "Method 1 — geometric dovetail spacing on the centerline (the " +
      "standard way). You need only two measurements: board width B and " +
      "board thickness D. Step 1: estimate the number of tails with AZS = " +
      "B divided by (1.7 times D). Example B=140 mm, D=20 mm: AZS = 140 / " +
      "(1.7 x 20) = 140 / 34 = 4.12, so about 4 tails. Step 2: number of " +
      "parts AZT = AZS times 3 plus 1. With 4 tails: 4 x 3 + 1 = 13 parts. " +
      "The one extra part comes from the two half pins at the edges. Step " +
      "3: part width T = B / AZT = 140 / 13 = 10.77 mm. So a pin is about " +
      "10.8 mm wide and a tail about 21.6 mm (2T). Step 4: set the slope, " +
      "1:6 — over the tail length the flank drifts out ZS = 6 x T, about " +
      "65 mm (as a slope triangle: 10.8 of rise to 65 of run). And the " +
      "layout is done.",
    metadata: {
      source: "own-paraphrase",
      title: "Method 1: centerline spacing (AZS, AZT, T, slope) — example B=140/D=20",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4, example B=140/D=20",
    },
  },
  {
    id: "konstruktion-warum-17",
    text:
      "Why does the tail formula use the number 1.7? It's a workshop rule " +
      "of thumb, not a law of nature. AZS = B / (1.7 x D) gives you a " +
      "NUMBER OF TAILS at which the tails sit in a handsome, sturdy " +
      "proportion to the board thickness — not too many tiny ones, not too " +
      "few chunky ones. If you want FEWER, wider tails, use 2 instead of " +
      "1.7: AZS = B / (2 x D). Both ways are correct; the factor only " +
      "controls how fine the spacing gets. Memory hook for the apprentice: " +
      "1.7 is your thumb value for 'normal-fine', 2 for 'a bit coarser'. " +
      "And in the end the eye gets a vote — you're allowed to simply set " +
      "the count by eye.",
    metadata: {
      source: "own-paraphrase",
      title: "Why 1.7 in AZS = B/(1.7·D)? — rule of thumb explained",
      topic: "konstruktion",
      license: "own-paraphrase",
    },
  },
  {
    id: "konstruktion-randverstaerkung",
    text:
      "Method 2 — dovetail spacing with reinforced half pins. Use this " +
      "method when the half pins (at the very edges) should be beefier so " +
      "the corner won't break out. Step 1: half-pin reinforcement RZV = D " +
      "/ 3. With D=20 mm: RZV = 6.67, rounded to about 6.5 mm on the " +
      "workpiece. The full half-pin width is then 2 x RZV, about 13 mm. " +
      "Step 2: remaining width RB = B minus 2 x RZV = 140 minus 13 = 127 " +
      "mm. Step 3: number of tails on the remaining width: AZS = RB / (1.7 " +
      "x D) = 127 / 34 = 3.7, so 4 tails. Step 4: dovetail repeat ZT = RB " +
      "/ AZS = 127 / 4 = 31.8 mm. So the remaining width is divided into " +
      "four equal zones of about 32 mm, and the two edges stay extra " +
      "sturdy.",
    metadata: {
      source: "own-paraphrase",
      title: "Method 2: reinforced half pins (RZV, RB, ZT)",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4",
    },
  },
  {
    id: "konstruktion-grundlinie-ungerade",
    text:
      "Method 3 — odd parts on the baseline. The simplest way when it has " +
      "to go fast. You divide the baseline into an ALWAYS odd number of " +
      "equal parts. Step 1: number of parts AZT = B / SL. SL is the tail " +
      "length; for through dovetails SL equals the board thickness D. " +
      "Example B=140 mm, SL=20 mm: AZT = 140 / 20 = 7 parts. Important: " +
      "the result must be rounded to an odd number — 5, 7, 9, 11 and so " +
      "on. Step 2: part width T = B / AZT = 140 / 7 = 20 mm. Because pins " +
      "and tails alternate and the count is odd, a pin sits at the outside " +
      "on both edges — that gives a clean, symmetrical corner.",
    metadata: {
      source: "own-paraphrase",
      title: "Method 3: odd parts on the baseline (AZT = B/SL)",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4",
    },
  },
  {
    id: "konstruktion-halbverdeckt",
    text:
      "Half-blind dovetails — when the joint must NOT show from the front " +
      "(typical for drawers: front clean, dovetails visible only from the " +
      "side). A thin lap of material is left standing on one side to hide " +
      "the joint. You choose the lap thickness BL between a quarter and a " +
      "third of the board thickness: BL = D/4 to D/3. With D=20 mm that's " +
      "about 5 to 6.7 mm. The usable tail length gets shorter as a result: " +
      "SL = D minus BL. If you work with SL=15 mm, the baseline division " +
      "at B=140 gives: AZT = 140 / 15 = 9.3, rounded to the nearest odd " +
      "number, so 9 parts. Beyond that, the same logic applies as for " +
      "through dovetails.",
    metadata: {
      source: "own-paraphrase",
      title: "Half-blind dovetails — lap thickness BL = D/4 to D/3, SL = D − BL",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4",
    },
  },
  {
    id: "konstruktion-hilfsstrahl",
    text:
      "The diagonal-line trick — for when the part width comes out as an " +
      "awkward number. Example B=140 mm, D=18 mm: AZT = 140 / 18 = 7.78, " +
      "rounded to 9 parts. The computed part width would be 140 / 9 = " +
      "15.56 mm — you can't step off a measurement like that cleanly nine " +
      "times. Instead: draw a slanted construction line away from one edge " +
      "of the board. Step off nine EQUAL segments of any convenient size " +
      "on it, say 20 mm each (making 180 mm). Connect the last point to " +
      "the far end of the board width. Now transfer the remaining points " +
      "back to the baseline with parallel lines — and there are your nine " +
      "exactly equal divisions, without ever measuring a decimal. An old " +
      "geometry trick that works on the board just as well as on paper.",
    metadata: {
      source: "own-paraphrase",
      title: "Diagonal line — equal divisions without measuring awkward numbers",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4",
    },
  },
  {
    id: "konstruktion-schwindmass-regel",
    text:
      "The most important material rule in dovetailing — one no beginner " +
      "may let slip past: with solid wood, NEVER glue long grain rigidly " +
      "to cross grain if that blocks the wood's natural movement. Wood " +
      "works — it swells and shrinks with humidity, and far more across " +
      "the grain than along it. Glue two parts so that their movements " +
      "fight each other, and the joint will crack over time — the piece of " +
      "furniture is ruined. That is exactly why the dovetail is so good: " +
      "it locks mechanically and still lets the wood move, without the " +
      "corner tearing open. Mnemonic: think about shrinkage first, then " +
      "about the spacing.",
    metadata: {
      source: "own-paraphrase",
      title: "Wood-movement rule — never glue long grain rigidly to cross grain",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4 (solid-wood warning)",
    },
  },
  {
    id: "konstruktion-kreative-teilung",
    text:
      "May you deviate from the formulas? Yes — and it's expressly " +
      "allowed. The math gives you a clean, regular standard spacing. But " +
      "in modern furniture making, visible dovetails are deliberately used " +
      "as a design element: tails of different widths, intentionally " +
      "irregular spacing, slim accent pins. As long as three things hold, " +
      "anything goes: enough strength, sufficient edge margins (the corner " +
      "must not break out), and respect for wood movement. The formula is " +
      "your solid foundation — the design on top of it is craftsmanship.",
    metadata: {
      source: "own-paraphrase",
      title: "Creative dovetail spacing — when you may deviate from the formula",
      topic: "konstruktion",
      license: "own-paraphrase",
      attribution:
        "paraphrased from Konstruktionslehre (German cabinetmaking textbook), ch. 4",
    },
  },
];

export function getZinkenKonstruktionCorpusEn(): RAGDocument[] {
  return ZINKEN_KONSTRUKTION_CORPUS_EN;
}
