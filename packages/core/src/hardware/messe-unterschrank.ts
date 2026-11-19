/**
 * Messe-Vorlage »Unterschrank 600, eine Tür, ein Innenschubkasten«
 * (Blum CLIP top an der Tür, Blum MOVENTO unter dem Schubkasten).
 *
 * Gleicher Schrank wie in der App (Stolperliste Ziel 2, Punkt 7), damit
 * Web, AR und App dasselbe zeigen. Alle Maße stammen aus cody-cad daten
 * (nur gelesen). Was dort »annahme« ist, trägt hier `offen`. Deshalb bleibt
 * die Korpusseite ENTWURF und der Renderer zeigt dort keine Bohrpunkte.
 *
 * QUELLEN
 *   Korpus 600 × 850 × 575 (ohne Sockel, ohne Front): daten/demo/
 *     korpus-vorlagen.json »demo-unterschrank«, freigabe meister
 *     (Bernhard 18.09.2026).
 *   Aufbau wie cody-cad (führt, Meister 1172 18.11.2026): EINE Tür über die
 *     ganze Höhe (Fach 1 leftdoor), der Schubkasten sitzt als Innenauszug
 *     hinter der Tür, ohne eigene Front (cody-cad App 7d61005e,
 *     kern/protokoll/korpus_stueckliste.py demo_messe_unterschrank_eingaben).
 *   Fugen 2 mm außen je Kante: daten/standards/
 *     tischlerei-standard.json, freigabe meister (Bernhard 22.09.2026).
 *   Plattenstärke 19: demo-aufbau-19 (Demo-Katalog, synthetisch).
 *   MOVENTO 766H5000S, NL 500: daten/beschlaege/blum-766h5000s.json
 *     (Blum Katalog 2024/25 S. 428). Schraubpunkte 37 / 243 / 261 / 293 /
 *     357 ab Vorderkante, nur 37 ist bestätigt (Bernhard TG 6486). Die
 *     Schraublinie liegt 38 über OK Unterboden (Annahme, kern/korpus/
 *     schubkasten_blum.py, Blum-Konfigurator).
 *   Holzschubkasten H 150 bei LW 562: kern/korpus/schubkasten_blum.py
 *     (B2a, Ablesung T3.7).
 *
 * NICHT BELEGT (als Annahme markiert)
 *   Zwei Scharniere bei Tür 846: Blum-Faustregel (bis 900 mm Höhe zwei),
 *   keine Blum-Unterlage mit Seite (cody-cad SCHARNIERE_JE_HOEHE, auch dort
 *   Annahme). Platz auf der Bandseite für den Innenauszug hinter der Tür
 *   (CLIP top 110°, Eckanschlag) ist nicht geprüft.
 */

import { BLUM_CLIP_TOP, WERKSTATT_LAGE } from "./blum-clip-top.js";
import type { DrillPoint, HardwareLayout } from "./types.js";

const FUGE_AUSSEN = 2;
const PLATTE = 19;

const KORPUS = { breite: 600, hoehe: 850, tiefe: 575 } as const;
const FRONT_BREITE = KORPUS.breite - 2 * FUGE_AUSSEN;
/** Eine Tür über die ganze Höhe (wie cody-cad): 850 − 2 × 2 = 846. */
const TUER_HOEHE = KORPUS.hoehe - 2 * FUGE_AUSSEN;

export const BLUM_MOVENTO = {
  artikel: "Blum MOVENTO 766H5000S",
  nennlaenge: 500,
  /** Schraubpunkte ab Korpus-Vorderkante; nur 37 ist bestätigt. */
  schrauben: [
    { x: 37, bestaetigt: true },
    { x: 243, bestaetigt: false },
    { x: 261, bestaetigt: false },
    { x: 293, bestaetigt: false },
    { x: 357, bestaetigt: false },
  ],
  /** Schraublinie über OK Unterboden (Annahme). */
  schraublinieUeberBoden: 38,
  kupplung: "Blum T51.7601 (links + rechts)",
} as const;

export const MESSE_UNTERSCHRANK = {
  id: "messe-unterschrank-600",
  name: "Unterschrank 600 · 1 Tür · 1 Innenschubkasten",
  korpus: KORPUS,
  plattenstaerke: PLATTE,
  tuer: { breite: FRONT_BREITE, hoehe: TUER_HOEHE },
  /** Innenauszug hinter der Tür, keine eigene Front (wie cody-cad). */
  schubkastenInnen: true,
  /** Holzschubkasten bei H 150 / LW 562 (cody-cad B2a, Ablesung T3.7). */
  schubkastenTeile: [
    "Vorderstück 520 × 121 × 16",
    "Hinterstück 520 × 121 × 16",
    "Seite links 490 × 150 × 16",
    "Seite rechts 490 × 150 × 16",
    "Boden 530 × 490 × 16",
  ],
  annahmen: [
    `Zwei Scharniere bei Tür ${TUER_HOEHE} mm: Blum-Faustregel, keine Blum-Unterlage mit Seite.`,
    "Innenschubkasten hinter der Tür: Platz auf der Bandseite (CLIP top 110°, Eckanschlag) nicht geprüft.",
    "Plattenstärke 19 mm angenommen, Unterboden zwischen den Seiten.",
  ],
} as const;

const SEITE_FRAME = "carcass.left.inner.frontTop";

/**
 * Korpusseite links (flach, Innenfläche oben, Vorderkante links) mit den
 * zwei Montageplatten für die Tür oben und der MOVENTO-Schiene unten.
 */
export function buildMesseUnterschrankSeiteLayout(): HardwareLayout {
  const b = BLUM_CLIP_TOP;
  const e = WERKSTATT_LAGE.endabstand.wert;
  const halb = b.platteLochabstand / 2;
  // Scharnierhöhen an der Seite, ab Oberkante: Fuge oben + Endabstand an der Tür.
  const hoehen = {
    oben: FUGE_AUSSEN + e,
    unten: FUGE_AUSSEN + TUER_HOEHE - e,
  };
  const platte: DrillPoint[] = (["oben", "unten"] as const).flatMap((wo) =>
    ([-1, 1] as const).map((s, i) => ({
      id: `platte.${wo}.${i + 1}`,
      frame: SEITE_FRAME,
      x: b.platteLochreihe,
      y: hoehen[wo] + s * halb,
      yRef: "oberkante" as const,
      diameter: 3.5,
      depth: 1,
      tool: "Ankörnen · Schraube (Art nicht belegt)",
      stepId: "B3.platte_schrauben",
      offen:
        "Plattenhöhe angenommen: Mitte auf Scharnierhöhe der Tür (Fuge 2 + 100), " +
        "Löcher ±16 darum. Schraubenart nicht belegt.",
    })),
  );

  const m = BLUM_MOVENTO;
  const yLinie = PLATTE + m.schraublinieUeberBoden;
  const offeneX = m.schrauben.filter((s) => s.x < KORPUS.tiefe && !s.bestaetigt).map((s) => s.x);
  const schiene: DrillPoint[] = m.schrauben
    .filter((s) => s.x < KORPUS.tiefe)
    .map((s) => ({
      id: `movento.${s.x}`,
      frame: SEITE_FRAME,
      x: s.x,
      y: yLinie,
      yRef: "unterkante" as const,
      diameter: 3.5,
      depth: 1,
      tool: "Ankörnen · Schraube (Art nicht belegt)",
      stepId: "M1.schiene_schrauben",
      offen:
        `Schraublinie ${m.schraublinieUeberBoden} über OK Boden Unten ist eine Annahme ` +
        `(Blum-Konfigurator), Boden ${PLATTE} mm angenommen.` +
        // Ein Satz für die ganze Gruppe (im Bohrplan nur einmal gezeigt).
        (offeneX.length
          ? ` Abstände ${offeneX.join(" / ")} ab Vorderkante nicht bestätigt.`
          : ""),
    }));

  return {
    id: "messe-unterschrank-600--korpusseite-links",
    status: "entwurf",
    label: "Korpusseite links: Montageplatten 173L6100 + MOVENTO 766H5000S",
    article: "Blum 173L6100 · Blum 766H5000S",
    anschlag: "links",
    faceWidth: KORPUS.tiefe,
    source: {
      document: "Blum MD-029/3 · 11.24",
      page: 5,
      crosscheck: "Blum Katalog 2024/25 S. 428 (MOVENTO)",
    },
    points: [...platte, ...schiene],
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
        id: "y.unten",
        axis: "y",
        from: "Unterkante",
        segments: [{ label: `${yLinie}`, value: yLinie, toPointId: "movento.37" }],
        total: yLinie,
      },
    ],
  };
}
