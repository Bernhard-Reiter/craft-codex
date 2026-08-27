/**
 * Bohrbild — Hawa Combino 65/80 H FS ul, Türblatt.
 *
 * QUELLE
 *   Montageanleitung 788.2000.310 (09|2019), Seite 8, Schritt E.
 *   Gegengeprüft: Häfele Katalog DGH-M2022, Seite 10.138 (dort als Variante
 *   "80 H VF ul"; die Türblatt-Bohrung ist laut Fachauskunft identisch).
 *   Acht Maße stimmen in beiden Quellen überein: 113, 94, 85, 104, 24, 66,
 *   Ø25×10, Ø3×3. Der Katalog nennt zusätzlich 19 und 28.
 *
 * ANSCHLAG
 *   Die Vorlage zeigt ausdrücklich die Aussentüre (AT) NACH LINKS ÖFFNEND
 *   (Montageanleitung S. 5). Für die Gegenrichtung mirrorLayout() verwenden.
 *
 * PRÜFSTAND: ENTWURF
 *   Drei Zuordnungen konnten aus der isometrischen Zeichnung nicht
 *   zweifelsfrei abgeleitet werden; sie stehen als `offen` an den betroffenen
 *   Bohrungen. Solange auch nur eine offen ist, bleibt der Status "entwurf" —
 *   der Renderer zeigt dann die Maßketten zum Nachmessen, aber keine
 *   Bohrpunkte. Die Maße selbst sind gesichert, nur ihre Zuordnung nicht.
 */

import type { HardwareLayout } from "./types.js";

/** Bezugsfläche: Beschlagseite des Türblatts, Ursprung obere linke Ecke. */
const FRAME = "door.faceA.topLeft";

/**
 * Baut das Bohrbild für eine konkrete Türblattbreite.
 *
 * Die Breite ist Parameter und nicht Konstante, weil alle Maße von den Kanten
 * aus gelten: die oberen Bohrungen ab Oberkante, die unteren ab Unterkante,
 * die waagrechten ab linker Kante. Ein festes Maß wäre bei jeder anderen Tür
 * falsch.
 *
 * @param faceWidth Türblattbreite in mm (TB in der Vorlage).
 */
export function buildHawaCombinoLayout(faceWidth: number): HardwareLayout {
  return {
    id: "hawa-combino-65-80-h-fs-ul--tuerblatt",
    status: "entwurf",
    label: "Hawa Combino 65/80 H FS ul — Türblatt",
    article: "Hawa Combino 65/80 H FS ul",
    anschlag: "links",
    faceWidth,
    source: {
      document: "788.2000.310",
      page: 8,
      crosscheck: "Häfele DGH-M2022, S. 10.138",
    },

    points: [
      // — Laufwerk, ab Oberkante ————————————————————————————————————————
      {
        id: "lauf.a",
        frame: FRAME,
        x: 113,
        y: 19,
        yRef: "oberkante",
        diameter: 3,
        depth: 3,
        tool: "Ø 3 Holzbohrer",
        stepId: "E.tuer_bohren",
        offen:
          "Höhenmaß nicht belegt. Die 113er-Maßlinie führt senkrecht auf diese " +
          "Bohrung, ein vertikales Maß steht in der Vorlage aber nirgends. " +
          "y=19 ist angenommen (gleiche Höhe wie lauf.b) — zu bestätigen.",
      },
      {
        id: "lauf.b",
        frame: FRAME,
        x: 207, // 113 + 94
        y: 19,
        yRef: "oberkante",
        diameter: 3,
        depth: 3,
        tool: "Ø 3 Holzbohrer",
        stepId: "E.tuer_bohren",
      },
      {
        id: "lauf.c",
        frame: FRAME,
        x: 207, // 113 + 94
        y: 47, // 19 + 28
        yRef: "oberkante",
        diameter: 3,
        depth: 3,
        tool: "Ø 3 Holzbohrer",
        stepId: "E.tuer_bohren",
      },

      // — Führung + Topf, ab Unterkante ——————————————————————————————————
      {
        id: "fuehr.topf",
        frame: FRAME,
        x: 120,
        y: 104,
        yRef: "unterkante",
        diameter: 25,
        depth: 10,
        tool: "Ø 25 Forstnerbohrer",
        stepId: "E.tuer_bohren",
        // Als einzige Bohrung eindeutig bemaßt: 120 ab linker Kante,
        // 104 ab Unterkante, beide Maßlinien laufen sichtbar auf die Topfmitte.
      },
      {
        id: "fuehr.d",
        frame: FRAME,
        x: 87,
        y: 109, // 85 + 24
        yRef: "unterkante",
        diameter: 3,
        depth: 3,
        tool: "Ø 3 Holzbohrer",
        stepId: "E.tuer_bohren",
        offen:
          "Zuordnung der Maße 85 und 24 unsicher. Beide stehen übereinander, " +
          "die Perspektive lässt offen, ob 85 von dieser Bohrung nach unten " +
          "misst und 24 von dort zur Unterkante — oder umgekehrt. " +
          "y=109 (85+24) ist angenommen.",
      },
      {
        id: "fuehr.e",
        frame: FRAME,
        x: 153, // 87 + 66
        y: 24,
        yRef: "unterkante",
        diameter: 3,
        depth: 3,
        tool: "Ø 3 Holzbohrer",
        stepId: "E.tuer_bohren",
        offen:
          "Höhenmaß aus derselben unklaren 85/24-Kette abgeleitet wie fuehr.d. " +
          "y=24 ist angenommen.",
      },
    ],

    // Die Maßketten sind die belastbare Hälfte dieses Bohrbilds: die Zahlen
    // stammen unverändert aus beiden Quellen und gehen rechnerisch auf. Sie
    // werden dem Tischler zum Nachmessen angezeigt.
    chains: [
      {
        id: "oben.x",
        axis: "x",
        from: "linke Türkante",
        segments: [
          { label: "113", value: 113, toPointId: "lauf.a" },
          { label: "94", value: 94, toPointId: "lauf.b" },
        ],
        total: 207,
      },
      {
        id: "oben.y",
        axis: "y",
        from: "Oberkante",
        segments: [
          { label: "19", value: 19, toPointId: "lauf.b" },
          { label: "28", value: 28, toPointId: "lauf.c" },
        ],
        total: 47,
      },
      {
        id: "unten.x",
        axis: "x",
        from: "linke Türkante",
        segments: [
          { label: "87", value: 87, toPointId: "fuehr.d" },
          { label: "66", value: 66, toPointId: "fuehr.e" },
        ],
        total: 153,
      },
      {
        id: "unten.y",
        axis: "y",
        from: "Unterkante",
        segments: [
          { label: "24", value: 24, toPointId: "fuehr.e" },
          { label: "85", value: 85, toPointId: "fuehr.d" },
        ],
        total: 109,
      },
    ],
  };
}

/**
 * OFFEN, über die Bohrungen hinaus:
 *
 * Auf Seite 8 tragen in den Gesamtansichten ALLE Türkanten die Maße 113 (oben)
 * und 120 (unten) — linke wie rechte. Das legt nahe, dass sich das Bohrbild
 * spiegelbildlich an der zweiten Türkante wiederholt. Dann wären es nicht 6,
 * sondern 12 Bohrungen je Türblatt.
 *
 * Bis das geklärt ist, bildet dieses Layout nur die linke Kante ab. Die
 * Ergänzung wäre mechanisch: mirrorLayout() auf die eigenen Punkte anwenden
 * und beide Punktmengen vereinigen.
 */
