import {
  computeDovetailLayout,
  type DovetailMethod,
} from "@craft-codex/core";
import type { AnreissFlow, AnreissSchritt } from "./anreiss-flow";

/**
 * Anreiss-Flow — ENGLISCHER Zwilling von anreiss-flow.ts.
 *
 * Gleiche deterministische State-Machine, gleiche Phasen-IDs, gleiche
 * zeigeLinien-Keys, gleiche Berechnung (computeDovetailLayout); NUR die
 * gesprochenen/angezeigten Texte (label, meisterSagt, kennzahl, tafel) sind
 * ins Englische übersetzt. Glossar: Schwalben=tails, Zinken=pins,
 * Streichmaß=marking gauge, Schmiege=bevel gauge.
 *
 * Formel-Kürzel (AZS, AZT, T, ZS) bleiben bewusst wie auf der deutschen
 * Werkstattzeichnung — der Konstruktions-Korpus erklärt sie dem Lehrling.
 *
 * Zahlen-FORMAT ist US-Locale: Dezimalpunkt statt Komma ("10.8 mm").
 */

/** Auf eine Dezimale runden, fuer gesprochene Masse — US-Format ("10.8 mm"). */
function mm(x: number): string {
  return x.toFixed(1);
}

/**
 * Baut den geführten Anreiss-Flow für Methode 1 (Mittellinie) — EN.
 *
 * @param B Brettbreite in mm
 * @param D Brettdicke in mm
 */
export function buildAnreissFlowEn(
  B: number,
  D: number,
  method: DovetailMethod = "mittellinie",
): AnreissFlow {
  const L = computeDovetailLayout(B, D, method);

  const schritte: AnreissSchritt[] = [
    {
      id: "messen",
      label: "Measure",
      meisterSagt:
        `First we measure the board. The width is B = ${mm(B)} millimeters, ` +
        `the thickness D = ${mm(D)} millimeters. That's all we need to work ` +
        `out the whole dovetail layout. If you're wondering about anything, just ask.`,
      zeigeLinien: [],
      kennzahl: `B = ${mm(B)} mm · D = ${mm(D)} mm`,
      tafel: [`Board width     B = ${mm(B)} mm`, `Board thickness D = ${mm(D)} mm`],
      frageErlaubt: true,
    },
    {
      id: "schwalbenzahl",
      label: "Tail count",
      meisterSagt:
        `Now we estimate how many tails fit on the board. The formula is ` +
        `AZS = B divided by 1.7 times D, so ${mm(B)} divided by ` +
        `${mm(1.7 * D)} = ${L.AZS_raw.toFixed(2)}. ` +
        `Rounded, that's ${L.AZS} tails. The 1.7 is a rule of thumb from ` +
        `the workshop — ask me if you want to know why.`,
      zeigeLinien: [],
      kennzahl: `${L.AZS} tails`,
      tafel: [
        `AZS = B / (1.7 · D)`,
        `    = ${mm(B)} / ${mm(1.7 * D)}`,
        `    = ${L.AZS_raw.toFixed(2)} ≈ ${L.AZS} tails`,
      ],
      frageErlaubt: true,
    },
    {
      id: "teile",
      label: "Divide",
      meisterSagt:
        `From the tails we get the division: AZT = AZS times 3 plus 1 = ` +
        `${L.AZS} times 3 plus 1 = ${L.AZT} parts. Each part is T = B divided by AZT ` +
        `= ${mm(L.T)} millimeters wide. Remember: a pin is 1 part ` +
        `(${mm(L.zinkenBreite)} mm), a tail is 2 parts (${mm(L.schwalbeBreite)} mm).`,
      zeigeLinien: ["mittellinie"],
      kennzahl: `${L.AZT} parts × ${mm(L.T)} mm`,
      tafel: [
        `AZT = AZS · 3 + 1 = ${L.AZT} parts`,
        `T   = B / AZT = ${mm(L.T)} mm`,
        `Pin 1T = ${mm(L.zinkenBreite)} · Tail 2T = ${mm(L.schwalbeBreite)}`,
      ],
      frageErlaubt: true,
    },
    {
      id: "streichmass",
      label: "Marking gauge",
      meisterSagt:
        `The marking gauge comes first: we scribe the board thickness all ` +
        `the way around. This red line is your chopping depth — when you chop, ` +
        `you never go deeper. See how it runs right around the board.`,
      zeigeLinien: ["streichmass_brettstaerke"],
      tafel: [`Chopping depth = board thickness D = ${mm(D)} mm`],
      frageErlaubt: true,
    },
    {
      id: "markieren",
      label: "Mark",
      meisterSagt:
        `Now we divide the width and mark the tails — ${L.AZS} of them, ` +
        `evenly spaced. Pins narrow, tails twice as wide. ` +
        `These lines show you where the saw will go later.`,
      zeigeLinien: ["mittellinie", "schwalbe_pin_"],
      kennzahl: `${L.AZS} tails marked`,
      tafel: [
        `Pin  = 1 part  (${mm(L.zinkenBreite)} mm)`,
        `Tail = 2 parts (${mm(L.schwalbeBreite)} mm)`,
        `${L.AZS} tails evenly spaced`,
      ],
      frageErlaubt: true,
    },
    {
      id: "schraege",
      label: "Slope",
      meisterSagt:
        `Finally the slope: 1 in ${L.slopeRatio}, that's about ` +
        `${L.slopeDeg.toFixed(0)} degrees. With the bevel gauge you lay out ` +
        `each tail flank. Steeper breaks out, shallower holds worse — ` +
        `1 in ${L.slopeRatio} is the proven middle ground.`,
      zeigeLinien: ["mittellinie", "schwalbe_pin_"],
      kennzahl: `Slope 1:${L.slopeRatio}`,
      tafel: [
        `Slope = 1 : ${L.slopeRatio}  (≈ ${L.slopeDeg.toFixed(0)}°)`,
        `ZS = ${L.slopeRatio} · T = ${mm(L.ZS)} mm`,
      ],
      frageErlaubt: true,
    },
    {
      id: "fertig",
      label: "Done",
      meisterSagt:
        `The layout is done. You've got ${L.AZS} tails across ${L.AZT} parts, ` +
        `each ${mm(L.T)} millimeters, with a slope of 1 in ${L.slopeRatio}. ` +
        `Now you may saw — always on the waste side of the line.`,
      zeigeLinien: ["streichmass_brettstaerke", "mittellinie", "schwalbe_pin_"],
      kennzahl: "Layout complete",
      tafel: [
        `${L.AZS} tails · ${L.AZT} parts × ${mm(L.T)} mm`,
        `Slope 1 : ${L.slopeRatio}`,
        `→ ready to saw`,
      ],
      frageErlaubt: true,
    },
  ];

  return { layout: L, schritte };
}

/** Sichtbarkeits-Check ist sprachneutral — Re-Export unter EN-Namen. */
export { istLinieSichtbar as istLinieSichtbarEn } from "./anreiss-flow";
