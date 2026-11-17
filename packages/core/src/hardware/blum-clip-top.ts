/**
 * Bohrbild — Blum CLIP top BLUMOTION 110° (71B3550) mit
 * Kreuzmontageplatte 173L6100, Unterschrank-Tür mit zwei Scharnieren.
 *
 * QUELLE (Datenformat cody-cad, nur gelesen, keine Werte erfunden)
 *   Topf Ø35 (+0,2/−0), Tiefe 10,5–13, Schrauben 3,5 × 17:
 *     daten/beschlaege/blum-71b3550.json ← Blum MD-029/3 · 11.24, S. 4
 *     (Kasten »Schraubmontage«). Tiefe als Bereich: Bernhard 08.09.2026
 *     »min. 10,5 / max. 13,0 — alles dazwischen ist OK«.
 *   Flanschlöcher ±22,5 längs der Türkante, 9,5 von der Kante weg (bezogen
 *     auf die Topfmitte): gemessen in Blums CAD-Modell 71B3550 (STEP,
 *     Zeichnung 43192717), siehe derselbe Datensatz.
 *   Montageplatte: Lochreihe 37 mm ab Korpus-Vorderkante, Lochabstand 32 mm:
 *     daten/beschlaege/blum-173l6100.json ← Blum MD-029/3, S. 5.
 *
 * WAS NICHT BELEGT IST (deshalb Status ENTWURF)
 *   Die LAGE des Scharniers an der Tür ist keine Blum-Konstante, sondern eine
 *   Werkstatt-Wahl: Bohrmitte 22,5 mm ab Anschlagkante und 100 mm ab Ober-
 *   und Unterkante stehen in cody-cad daten/standards/tischlerei-standard.json
 *   als »annahme« (FreeCAD-Test, Blum-Planungsunterlage fehlt). Solange
 *   Bernhard sie nicht bestätigt, tragen die Topfbohrungen `offen` — der
 *   Renderer zeigt Maßketten, aber keine Bohrpunkte.
 *   Bestätigt er beide Werte: in WERKSTATT_LAGE `bestaetigt: true` setzen.
 *   Dann wird das Türbild "geprueft" (alle übrigen Maße sind belegt).
 *
 * ANSCHLAG: links (Scharniere an der linken Türkante, Fläche A = Innenseite
 * der Front). Für rechts mirrorLayout() verwenden.
 */

import type { DrillPoint, HardwareLayout, YRef } from "./types.js";

/** Werkstatt-Wahl zur Lage der Scharniere — siehe Kopfkommentar. */
export const WERKSTATT_LAGE = {
  /** Bohrmitte Topf ab Anschlagkante, mm. */
  kantenabstand: { wert: 22.5, bestaetigt: false },
  /** Bohrmitte Topf ab Ober- bzw. Unterkante, mm. */
  endabstand: { wert: 100, bestaetigt: false },
} as const;

/** Belegte Blum-Maße, alle in mm. */
export const BLUM_CLIP_TOP = {
  topfDurchmesser: 35,
  topfTiefeMin: 10.5,
  topfTiefeMax: 13,
  /** Flanschlöcher längs der Kante, ± ab Topfmitte. */
  flanschLaengs: 22.5,
  /** Flanschlöcher quer, von der Kante weg, ab Topfmitte. */
  flanschQuer: 9.5,
  schraube: "Spanplattenschraube 3,5 × 17",
  /** Montageplatte 173L6100: Lochreihe ab Korpus-Vorderkante. */
  platteLochreihe: 37,
  /** Montageplatte 173L6100: Abstand der zwei Schraublöcher. */
  platteLochabstand: 32,
} as const;

const TUER_FRAME = "door.faceA.topLeft";
/**
 * Korpusseite flach auf dem Tisch, Innenfläche oben:
 *   Ursprung = obere vordere Ecke, +x = von der Vorderkante in die Tiefe,
 *   +y = nach unten entlang der Vorderkante.
 */
const SEITE_FRAME = "carcass.left.inner.frontTop";

const LAGE_OFFEN =
  "Lage nicht belegt: Bohrmitte 22,5 mm ab Anschlagkante und 100 mm ab " +
  "Ober-/Unterkante sind Werkstatt-Annahmen (tischlerei-standard.json, " +
  "FreeCAD-Test). Bernhard bestätigt — dann WERKSTATT_LAGE.bestaetigt = true.";

function lageBestaetigt(): boolean {
  return (
    WERKSTATT_LAGE.kantenabstand.bestaetigt &&
    WERKSTATT_LAGE.endabstand.bestaetigt
  );
}

/** Topf + zwei Flanschschrauben für ein Scharnier. */
function scharnier(
  wo: "oben" | "unten",
  kante: number,
  ende: number,
): DrillPoint[] {
  const yRef: YRef = wo === "oben" ? "oberkante" : "unterkante";
  const b = BLUM_CLIP_TOP;
  const offen = lageBestaetigt() ? undefined : LAGE_OFFEN;
  return [
    {
      id: `topf.${wo}`,
      frame: TUER_FRAME,
      x: kante,
      y: ende,
      yRef,
      diameter: b.topfDurchmesser,
      // Untergrenze des belegten Bereichs 10,5–13; der Bereich steht im Werkzeug.
      depth: b.topfTiefeMin,
      tool: `Forstner Ø ${b.topfDurchmesser} · Tiefe ${b.topfTiefeMin}–${b.topfTiefeMax} mm`,
      stepId: "B1.topf_bohren",
      ...(offen ? { offen } : {}),
    },
    ...([-1, 1] as const).map((s) => ({
      id: `schraube.${wo}.${s < 0 ? "a" : "b"}`,
      frame: TUER_FRAME,
      x: kante + b.flanschQuer,
      y: ende + s * b.flanschLaengs,
      yRef,
      diameter: 3.5,
      // Schraubenlänge aus der Anleitung — nur zur Anzeige, keine Bohrtiefe.
      depth: 17,
      tool: b.schraube,
      stepId: "B2.topf_schrauben",
    })),
  ];
}

/**
 * Türbild für eine Unterschrank-Tür, Anschlag links.
 *
 * @param faceWidth  Türbreite in mm.
 * @param faceHeight Türhöhe in mm (für die Plausibilität: beide Scharniere
 *                   müssen auf die Tür passen).
 */
export function buildBlumClipTopTuerLayout(
  faceWidth: number,
  faceHeight: number,
): HardwareLayout {
  const k = WERKSTATT_LAGE.kantenabstand.wert;
  const e = WERKSTATT_LAGE.endabstand.wert;
  const b = BLUM_CLIP_TOP;
  if (2 * (e + b.flanschLaengs) > faceHeight) {
    throw new Error(
      `Tür ${faceHeight} mm ist zu niedrig für zwei Scharniere mit ${e} mm Endabstand.`,
    );
  }
  return {
    id: "blum-clip-top-71b3550--tuer",
    status: lageBestaetigt() ? "geprueft" : "entwurf",
    label: "Blum CLIP top BLUMOTION 110° — Unterschrank-Tür",
    article: "Blum 71B3550",
    anschlag: "links",
    faceWidth,
    source: {
      document: "Blum MD-029/3 · 11.24",
      page: 4,
      crosscheck: "Blum CAD 71B3550 (Flanschlöcher gemessen)",
    },
    points: [...scharnier("oben", k, e), ...scharnier("unten", k, e)],
    chains: [
      {
        id: "x.anschlag",
        axis: "x",
        from: "Anschlagkante (links)",
        segments: [
          { label: `${k}`, value: k, toPointId: "topf.oben" },
          { label: `${b.flanschQuer}`, value: b.flanschQuer, toPointId: "schraube.oben.a" },
        ],
        total: k + b.flanschQuer,
      },
      ...(["oben", "unten"] as const).map((wo) => ({
        id: `y.${wo}`,
        axis: "y" as const,
        from: wo === "oben" ? "Oberkante" : "Unterkante",
        segments: [
          { label: `${e - b.flanschLaengs}`, value: e - b.flanschLaengs, toPointId: `schraube.${wo}.a` },
          { label: `${b.flanschLaengs}`, value: b.flanschLaengs, toPointId: `topf.${wo}` },
          { label: `${b.flanschLaengs}`, value: b.flanschLaengs, toPointId: `schraube.${wo}.b` },
        ],
        total: e + b.flanschLaengs,
      })),
    ],
  };
}

/**
 * Montageplatten an der linken Korpusseite (Seite flach, Innenfläche oben).
 *
 * Belegt ist nur das Lochbild der Platte (37 / 32). Offen bleibt, auf welcher
 * Höhe die Platte zum Scharnier sitzt (hängt am Überschlag der Tür) und ob die
 * zwei Löcher symmetrisch um die Scharnierhöhe liegen — deshalb immer ENTWURF.
 *
 * @param korpusTiefe Seitentiefe in mm (Breite der flach liegenden Seite).
 */
export function buildBlumMontageplatteSeiteLayout(
  korpusTiefe: number,
): HardwareLayout {
  const e = WERKSTATT_LAGE.endabstand.wert;
  const b = BLUM_CLIP_TOP;
  const halb = b.platteLochabstand / 2;
  const platte = (wo: "oben" | "unten"): DrillPoint[] =>
    ([-1, 1] as const).map((s, i) => ({
      id: `platte.${wo}.${i + 1}`,
      frame: SEITE_FRAME,
      x: b.platteLochreihe,
      y: e + s * halb,
      yRef: wo === "oben" ? "oberkante" : "unterkante",
      diameter: 3.5,
      depth: 1,
      tool: "Ankörnen · Schraube (Art nicht belegt)",
      stepId: "B3.platte_schrauben",
      offen:
        "Plattenhöhe angenommen: Mitte auf Scharnierhöhe, Löcher ±16 darum. " +
        "Hängt am Überschlag der Tür; Schraubenart nicht belegt.",
    }));
  return {
    id: "blum-173l6100--korpusseite-links",
    status: "entwurf",
    label: "Blum Kreuzmontageplatte 173L6100 — Korpusseite links",
    article: "Blum 173L6100",
    anschlag: "links",
    faceWidth: korpusTiefe,
    source: { document: "Blum MD-029/3 · 11.24", page: 5 },
    points: [...platte("oben"), ...platte("unten")],
    chains: [
      {
        id: "x.vorderkante",
        axis: "x",
        from: "Korpus-Vorderkante",
        segments: [
          { label: `${b.platteLochreihe}`, value: b.platteLochreihe, toPointId: "platte.oben.1" },
        ],
        total: b.platteLochreihe,
      },
      {
        id: "y.oben",
        axis: "y",
        from: "Oberkante",
        segments: [
          { label: `${e - halb}`, value: e - halb, toPointId: "platte.oben.1" },
          { label: `${b.platteLochabstand}`, value: b.platteLochabstand, toPointId: "platte.oben.2" },
        ],
        total: e + halb,
      },
    ],
  };
}
