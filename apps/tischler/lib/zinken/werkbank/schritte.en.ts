import type { WerkbankSchritt } from "./schritte";

/** Marking chapter, the three workbench steps (stage 1). Same IDs, camera, markers and sources as de. */
export const WERKBANK_SCHRITTE_EN: readonly WerkbankSchritt[] = [
  {
    id: "bezugsflaeche",
    kurz: "Decide which face goes on the outside and mark it. You mark everything later from this face.",
    handgriff: "Write OUTSIDE on the outside face and draw the cabinetmaker's triangle across the edges of both boards.",
    kamera: "draufsicht",
    marker: [],
    kriterien: [
      "OUTSIDE is written on the outside face of each board.",
      "The cabinetmaker's triangle runs across the edges of all parts in the same direction.",
      "Each corner carries the same number on both parts.",
    ],
    warum: "Without a marked outside face you easily clamp the board the wrong way round, then the pins come out mirrored and wide on the outside.",
    quellen: ["lehrgang-anzeichnen-arbeitsschritt", "lehrgang-anzeichnen-fehler-1"],
    hilfen: {
      beobachten: "What do you see on your reference face before you mark anything?",
      hinweis: "The outside face is the one that shows later. If the growth rings lie flat, it is the heart side.",
      teilschritt: "First check that both boards are the same thickness and width and that the end grain is square.",
      erklaerung: "Write OUTSIDE on the outside face, draw the cabinetmaker's triangle across the edges of all parts and write the same number on both parts of each corner. Then you can no longer mix up outside and inside.",
    },
  },
  {
    id: "grundlinie",
    kurz: "Mark the baseline with the gauge at board thickness. On the pin board only on both faces, not across the edges.",
    handgriff: "Set the gauge from the mating board, put the fence on the end grain and mark lightly first, then firmer in the same track.",
    kamera: "schraeg",
    marker: ["baseline"],
    kriterien: [
      "The baseline is on both faces but not on the edges.",
      "It is there once, thin and without a second track.",
      "Its distance from the end grain is exactly the thickness of the mating board.",
    ],
    warum: "You only mark where you saw and chop, and a line across the edge stays visible later.",
    quellen: [
      "lehrgang-anzeichnen-arbeitsschritt",
      "lehrgang-anzeichnen-fehler-2",
      "lehrgang-anzeichnen-fehler-3",
      "lehrgang-anzeichnen-sicherheit",
    ],
    hilfen: {
      beobachten: "Where did you set your gauge, from the scale or from the mating board?",
      hinweis: "The fence rests on the end grain and must sit firmly, otherwise it tilts and the line comes out doubled or crooked.",
      teilschritt: "Set the gauge directly from the mating board and don't reset it until the end.",
      erklaerung: "Fence on one face of the mating board, cutter exactly on the other. Then, with the fence on the end grain of the pin board, mark the baseline on both faces only, lightly first, then firmer in the same track.",
    },
    sicherheit: true,
  },
  {
    id: "pruefen",
    kurz: "Check your board before you pick up the saw. What is wrong now cannot be corrected later.",
    handgriff: "Hold the steel rule against the end grain and compare the distance to the baseline with the thickness of the mating board.",
    kamera: "stirnseite",
    marker: ["baseline"],
    kriterien: [
      "The baseline sits at board thickness, measured from the end grain.",
      "It is only on the faces and does not run across the edges.",
      "It is continuous and clean, once and thin.",
    ],
    warum: "The baseline is the limit for saw and chisel, so a mistake here carries through every later cut.",
    quellen: [
      "lehrgang-anzeichnen-arbeitsschritt",
      "lehrgang-anzeichnen-fehler-2",
      "lehrgang-anzeichnen-fehler-3",
    ],
    hilfen: {
      beobachten: "Look at the edges of your pin board: what do you see there?",
      hinweis: "There must be no line on the edges and exactly one on the faces.",
      teilschritt: "First measure the distance from the baseline to the end grain on both faces.",
      erklaerung: "The baseline is right when it sits exactly at the thickness of the mating board on both faces, once and thin, and is missing on the edges. A doubled track comes from a tilted fence or a reset gauge.",
    },
  },
];
