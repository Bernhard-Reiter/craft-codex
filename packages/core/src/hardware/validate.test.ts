import { describe, it, expect } from "vitest";
import {
  validateLayout,
  assertValidLayout,
  mirrorLayout,
  mayRenderDrillPoints,
  openQuestions,
  resolveDrillY,
} from "./validate.js";
import type { HardwareLayout, DrillPoint } from "./types.js";

const punkt = (over: Partial<DrillPoint> = {}): DrillPoint => ({
  id: "p1",
  frame: "door.faceA.topLeft",
  x: 100,
  y: 200,
  yRef: "oberkante",
  diameter: 3,
  depth: 3,
  tool: "Ø 3 Holzbohrer",
  stepId: "E.tuer_bohren",
  ...over,
});

const layout = (over: Partial<HardwareLayout> = {}): HardwareLayout => ({
  id: "test-layout",
  status: "geprueft",
  label: "Testbeschlag",
  article: "Test 123",
  anschlag: "links",
  faceWidth: 600,
  source: { document: "000.0000.000", page: 1 },
  points: [punkt()],
  chains: [],
  ...over,
});

describe("validateLayout — Bohrungen", () => {
  it("akzeptiert ein sauberes Bohrbild", () => {
    expect(validateLayout(layout())).toEqual([]);
  });

  it("lehnt Durchmesser 0 ab", () => {
    const issues = validateLayout(layout({ points: [punkt({ diameter: 0 })] }));
    expect(issues.map((i) => i.rule)).toContain("point.diameter");
  });

  it("lehnt negative Tiefe ab", () => {
    const issues = validateLayout(layout({ points: [punkt({ depth: -5 })] }));
    expect(issues.map((i) => i.rule)).toContain("point.depth");
  });

  it("lehnt doppelte Bohrungs-IDs ab", () => {
    const issues = validateLayout(
      layout({ points: [punkt({ id: "a" }), punkt({ id: "a", x: 300 })] }),
    );
    expect(issues.map((i) => i.rule)).toContain("point.duplicateId");
  });

  it("lehnt Bohrungen außerhalb der Fläche ab", () => {
    const issues = validateLayout(layout({ points: [punkt({ x: 900 })] }));
    expect(issues.map((i) => i.rule)).toContain("point.outsideFace");
  });

  it("lehnt unbekannte Schritt-IDs ab, wenn Schritte übergeben werden", () => {
    const issues = validateLayout(layout(), ["A.zuschnitt", "B.daempfeinzug"]);
    expect(issues.map((i) => i.rule)).toContain("point.unknownStep");
  });

  it("prüft Schritte nicht, wenn keine übergeben werden", () => {
    expect(validateLayout(layout())).toEqual([]);
  });

  it("lehnt ein leeres Bohrbild ab", () => {
    const issues = validateLayout(layout({ points: [] }));
    expect(issues.map((i) => i.rule)).toContain("layout.empty");
  });
});

describe("validateLayout — Maßketten", () => {
  it("akzeptiert eine aufgehende Kette", () => {
    const issues = validateLayout(
      layout({
        chains: [
          {
            id: "k1",
            axis: "y",
            from: "Oberkante",
            segments: [
              { label: "19", value: 19 },
              { label: "28", value: 28 },
              { label: "66", value: 66 },
            ],
            total: 113,
          },
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it("fängt einen Zahlendreher in der Kette", () => {
    // 19 + 82 + 66 = 167, nicht 113 — genau der Fehler, den der Validator
    // abfangen soll, bevor jemand danach bohrt.
    const issues = validateLayout(
      layout({
        chains: [
          {
            id: "k1",
            axis: "y",
            from: "Oberkante",
            segments: [
              { label: "19", value: 19 },
              { label: "82", value: 82 },
              { label: "66", value: 66 },
            ],
            total: 113,
          },
        ],
      }),
    );
    expect(issues.map((i) => i.rule)).toContain("chain.sumMismatch");
    expect(issues[0]?.message).toContain("167");
  });

  it("toleriert Fließkomma-Rundung", () => {
    const issues = validateLayout(
      layout({
        chains: [
          {
            id: "k1",
            axis: "x",
            from: "Kante",
            segments: [
              { label: "0,1", value: 0.1 },
              { label: "0,2", value: 0.2 },
            ],
            total: 0.3,
          },
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it("lehnt Maße auf unbekannte Bohrungen ab", () => {
    const issues = validateLayout(
      layout({
        chains: [
          {
            id: "k1",
            axis: "y",
            from: "Oberkante",
            segments: [{ label: "113", value: 113, toPointId: "gibtsnicht" }],
            total: 113,
          },
        ],
      }),
    );
    expect(issues.map((i) => i.rule)).toContain("chain.unknownPoint");
  });
});

describe("Prüfstand und offene Fragen", () => {
  const mitOffenerFrage = layout({
    status: "entwurf",
    points: [punkt({ id: "A", offen: "Höhenmaß fehlt in der Vorlage" })],
  });

  it("erlaubt offene Fragen im Entwurf", () => {
    expect(validateLayout(mitOffenerFrage)).toEqual([]);
  });

  it("verriegelt: geprueft trotz offener Frage ist ein Fehler", () => {
    const issues = validateLayout({ ...mitOffenerFrage, status: "geprueft" });
    expect(issues.map((i) => i.rule)).toContain("layout.offenTrotzGeprueft");
    expect(issues[0]?.message).toContain("Höhenmaß fehlt");
  });

  it("rendert im Entwurf keine Bohrpunkte", () => {
    expect(mayRenderDrillPoints(mitOffenerFrage)).toBe(false);
  });

  it("rendert Bohrpunkte nur bei geprüftem und fehlerfreiem Bohrbild", () => {
    expect(mayRenderDrillPoints(layout())).toBe(true);
  });

  it("rendert keine Bohrpunkte, wenn geprueft aber fehlerhaft", () => {
    expect(mayRenderDrillPoints(layout({ points: [punkt({ depth: 0 })] }))).toBe(false);
  });

  it("listet die offenen Fragen für die Anzeige auf", () => {
    expect(openQuestions(mitOffenerFrage)).toEqual([
      { pointId: "A", frage: "Höhenmaß fehlt in der Vorlage" },
    ]);
  });
});

describe("resolveDrillY — zwei Bezugskanten auf ein System", () => {
  const H = 2000; // Türblatthöhe

  it("lässt ein Maß ab Oberkante unverändert", () => {
    expect(resolveDrillY(punkt({ y: 19, yRef: "oberkante" }), H)).toBe(19);
  });

  it("dreht ein Maß ab Unterkante um", () => {
    expect(resolveDrillY(punkt({ y: 104, yRef: "unterkante" }), H)).toBe(1896);
  });

  it("verschiebt untere Bohrungen mit der Türhöhe, obere nicht", () => {
    const oben = punkt({ y: 19, yRef: "oberkante" });
    const unten = punkt({ y: 104, yRef: "unterkante" });
    expect(resolveDrillY(oben, 2000)).toBe(resolveDrillY(oben, 2400));
    expect(resolveDrillY(unten, 2400) - resolveDrillY(unten, 2000)).toBe(400);
  });

  it("liefert bei einer Bohrung auf halber Höhe für beide Bezüge dasselbe", () => {
    expect(resolveDrillY(punkt({ y: 1000, yRef: "oberkante" }), H)).toBe(
      resolveDrillY(punkt({ y: 1000, yRef: "unterkante" }), H),
    );
  });
});

describe("assertValidLayout", () => {
  it("wirft mit lesbarer Meldung", () => {
    expect(() => assertValidLayout(layout({ points: [punkt({ depth: 0 })] })))
      .toThrowError(/Tiefe muss > 0 sein/);
  });

  it("wirft nicht bei sauberem Bohrbild", () => {
    expect(() => assertValidLayout(layout())).not.toThrow();
  });
});

describe("mirrorLayout", () => {
  const original = layout({
    faceWidth: 600,
    points: [
      punkt({ id: "topf", x: 113, y: 400, diameter: 25, depth: 10, tool: "Ø 25 Forstner" }),
      punkt({ id: "vor1", x: 66, y: 500 }),
    ],
  });

  it("spiegelt x an der Flächenmitte", () => {
    const m = mirrorLayout(original);
    expect(m.points.find((p) => p.id === "topf")?.x).toBe(600 - 113);
    expect(m.points.find((p) => p.id === "vor1")?.x).toBe(600 - 66);
  });

  it("lässt y unverändert", () => {
    const m = mirrorLayout(original);
    expect(m.points.map((p) => p.y)).toEqual(original.points.map((p) => p.y));
  });

  it("lässt Durchmesser, Tiefe, Werkzeug und Schritt unverändert", () => {
    const m = mirrorLayout(original);
    for (const p of original.points) {
      const g = m.points.find((q) => q.id === p.id);
      expect(g?.diameter).toBe(p.diameter);
      expect(g?.depth).toBe(p.depth);
      expect(g?.tool).toBe(p.tool);
      expect(g?.stepId).toBe(p.stepId);
    }
  });

  it("dreht die Anschlagsrichtung um", () => {
    expect(mirrorLayout(original).anschlag).toBe("rechts");
    expect(mirrorLayout(mirrorLayout(original)).anschlag).toBe("links");
  });

  it("ist selbstinvers in den Koordinaten", () => {
    const zurueck = mirrorLayout(mirrorLayout(original));
    expect(zurueck.points.map((p) => p.x)).toEqual(original.points.map((p) => p.x));
  });

  it("setzt den Prüfstand auf Entwurf zurück", () => {
    const geprueft = layout({ status: "geprueft", faceWidth: 600, points: [punkt()] });
    expect(mirrorLayout(geprueft).status).toBe("entwurf");
  });

  it("lässt die Bezugskante von y unverändert", () => {
    const m = mirrorLayout(
      layout({ points: [punkt({ yRef: "unterkante" })] }),
    );
    expect(m.points[0]?.yRef).toBe("unterkante");
  });

  it("verwirft die Maßketten, statt sie falsch zu beschriften", () => {
    const mitKette = layout({
      chains: [
        { id: "k1", axis: "y", from: "Oberkante links", segments: [{ label: "113", value: 113 }], total: 113 },
      ],
    });
    expect(mirrorLayout(mitKette).chains).toEqual([]);
  });

  it("liefert ein Layout, das den Validator besteht", () => {
    expect(validateLayout(mirrorLayout(original))).toEqual([]);
  });
});
