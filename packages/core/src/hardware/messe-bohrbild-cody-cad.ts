/**
 * Messe-Unterschrank: die drei Bohrungen, die der Bohrplan bisher nur als
 * »Lage folgt« nannte — Lagen aus dem cody-cad-Bohrbild (korpus.bohrbild,
 * demo_messe_unterschrank_eingaben, Stand cody-cad 640ba44b). Keine eigenen
 * Maße: was cody-cad als Annahme führt, bleibt hier Annahme.
 *
 * - Lochreihe: korpus.vorschau plan.bearbeitungen (Regel standard.lochreihe)
 * - Ø6 Hinterstück + Kupplung T51.7601 Boden: movento_schubkasten
 */

import type { DrillPoint, HardwareLayout } from "./types.js";

const QUELLE = { document: "Bohrbild aus der Zeichnung (Messe-Unterschrank)", page: 0 } as const;

/** Lochreihe je Korpusseite (Innenseite), wie die App sie heute rechnet. */
export const MESSE_LOCHREIHE = {
  durchmesser: 5,
  tiefe: 13,
  /** x ab Korpus-Vorderkante der beiden Reihen. */
  abVorne: [37, 293] as const,
  /** y ab Unterkante der Korpusseite: erste Bohrung, Raster, Anzahl je Reihe. */
  vonUnten: 41.5,
  raster: 32,
  jeReihe: 25,
  // Maße stehen in der Tabellenzeile »LR«; der Satz nennt nur Herkunft und offenen Entscheid.
  annahme: "Lochreihe nach App, Entscheid offen (Lage aus dem Bohrbild der Zeichnung).",
} as const;

/** Alle Lochreihen-Bohrungen einer Korpusseite (x ab Vorderkante, y ab Unterkante). */
export function messeLochreihePunkte(): { x: number; y: number }[] {
  const L = MESSE_LOCHREIHE;
  return L.abVorne.flatMap((x) =>
    Array.from({ length: L.jeReihe }, (_, i) => ({ x, y: L.vonUnten + i * L.raster })),
  );
}

/** Schubkasten-Hinterstück 520 × 121: Ø6 für MOVENTO, Fläche hinten, y ab Unterkante. */
export function buildMesseHinterstueckLayout(): HardwareLayout {
  const offen = "Ø6-Lage aus dem Bohrbild der Zeichnung (Blum MOVENTO, Ablesung T3.5 Z. 22): 7 ab Seitenkante, 11 ab Unterkante, Annahme.";
  const punkt = (x: number, i: number): DrillPoint => ({
    id: `oe6.${i + 1}`,
    frame: "schubkasten-hinterstueck",
    x,
    y: 11,
    yRef: "unterkante",
    diameter: 6,
    depth: 10,
    tool: "Bohrer Ø6, Tiefe 10",
    stepId: "M2.schubkasten",
    offen,
  });
  return {
    id: "messe-unterschrank-600--schubkasten-hinterstueck",
    status: "entwurf",
    label: "Schubkasten-Hinterstück: Ø6 für MOVENTO (Fläche hinten)",
    article: "Blum 766H5000S",
    anschlag: "links",
    faceWidth: 520,
    source: QUELLE,
    points: [7, 513].map(punkt),
    chains: [],
  };
}

/** Schubkasten-Boden 530 × 490: Kupplung T51.7601, Schrauben anreißen, Fläche unten, y ab Vorderkante. */
export function buildMesseBodenLayout(): HardwareLayout {
  const offen = "Kupplung-Lage aus dem Bohrbild der Zeichnung (Blum T51.7601): 16 / 36 ab Seitenkante, 8 ab Vorderkante, Annahme.";
  return {
    id: "messe-unterschrank-600--schubkasten-boden",
    status: "entwurf",
    label: "Schubkasten-Boden: Kupplung T51.7601 (Fläche unten)",
    article: "Blum T51.7601",
    anschlag: "links",
    faceWidth: 530,
    source: QUELLE,
    points: [16, 36, 494, 514].map((x, i) => ({
      id: `t51.${i + 1}`,
      frame: "schubkasten-boden",
      x,
      y: 8,
      // Vorderkante liegt im Blatt unten.
      yRef: "unterkante",
      // Anriss wie MOVENTO an der Seite: Ø3,5 / Tiefe 1 = Ankörnen (cody-cad führt hier keinen Ø).
      diameter: 3.5,
      depth: 1,
      tool: "Ankörnen · Schraube Kupplung",
      stepId: "M2.schubkasten",
      offen,
    })),
    chains: [],
  };
}
