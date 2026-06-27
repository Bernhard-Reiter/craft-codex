import { describe, it, expect } from "vitest";
import {
  buildDovetailDimensions,
  buildDovetailAnriss,
} from "../src/geometry/index.js";

/** Breite eines Polygons (Schwalbe/Abfall) auf Hoehe y (lineare Interpolation Stirn↔Grund). */
function breiteBeiY(poly: { x: number; y: number }[], y: number, D: number): number {
  // poly = [StirnLeft, StirnRight, GrundRight, GrundLeft]
  const t = y / D;
  const leftX = poly[0]!.x + (poly[3]!.x - poly[0]!.x) * t;
  const rightX = poly[1]!.x + (poly[2]!.x - poly[1]!.x) * t;
  return rightX - leftX;
}

describe("Teilungsebene Stirn vs Mittellinie (B=140, D=20, T=10,769, Δ=3,333)", () => {
  it("Stirn: Schwalbe exakt 2T an der Stirnkante, schmaler zur Grundlinie", () => {
    const A = buildDovetailAnriss(140, 20, "mittellinie", {}, "stirn");
    const t0 = A.tails[0]!.polygon;
    expect(breiteBeiY(t0, 0, 20)).toBeCloseTo(2 * A.layout.T, 4); // 2T an Stirn
    expect(breiteBeiY(t0, 20, 20)).toBeLessThan(2 * A.layout.T); // schmaler am Grund
    expect(A.teilungY).toBe(0);
  });

  it("Mittellinie: Schwalbe exakt 2T auf der Mittellinie, breiter an Stirn, schmaler am Grund", () => {
    const A = buildDovetailAnriss(140, 20, "mittellinie", {}, "mittellinie");
    const t0 = A.tails[0]!.polygon;
    expect(A.teilungY).toBe(10);
    expect(breiteBeiY(t0, 10, 20)).toBeCloseTo(2 * A.layout.T, 4); // 2T auf Mittellinie
    expect(breiteBeiY(t0, 0, 20)).toBeGreaterThan(2 * A.layout.T); // breiter an Stirn
    expect(breiteBeiY(t0, 20, 20)).toBeLessThan(2 * A.layout.T); // schmaler am Grund
  });

  it("Mittellinie: Maßkette liegt auf der Mittellinie (y=D/2)", () => {
    const dims = buildDovetailDimensions(140, 20, "mittellinie", {}, "mittellinie");
    const kette = dims.filter((d) => d.kind === "teil");
    expect(kette.length).toBe(9);
    expect(kette.every((d) => d.a.y === 10)).toBe(true);
  });
});

/**
 * Verifiziert die technische Bemaßung gegen die Spec-Zahlen
 * (B=140, D=20 → AZS=4, AZT=13, T=10,769, Versatz 3,333).
 */
describe("buildDovetailDimensions (B=140, D=20)", () => {
  const dims = buildDovetailDimensions(140, 20);
  const byId = (id: string) => dims.find((d) => d.id === id)!;

  it("liefert Gesamtmaß B ueber die ganze Breite, aussen (groesster Versatz)", () => {
    const b = byId("dim-board-width");
    expect(b.kind).toBe("gesamt");
    expect(b.a).toEqual({ x: 0, y: 0 });
    expect(b.b).toEqual({ x: 140, y: 0 });
    expect(b.label).toBe("B = 140 mm");
    expect(b.exactValue).toBe(140);
    // Gesamtmaß liegt weiter aussen als das Teilmaß T.
    expect(Math.abs(b.offset)).toBeGreaterThan(Math.abs(byId("dim-part-width").offset));
  });

  it("Brettdicke D ist senkrecht, rechts, = Grundlinienabstand", () => {
    const d = byId("dim-board-thickness");
    expect(d.direction).toBe("vertical");
    expect(d.a).toEqual({ x: 140, y: 0 });
    expect(d.b).toEqual({ x: 140, y: 20 });
    expect(d.label).toBe("D = 20 mm");
  });

  it("Teilbreite T = 10,77 mm angezeigt, exakt unrund gespeichert", () => {
    const t = byId("dim-part-width");
    expect(t.label).toBe("T = 10,77 mm");
    expect(t.exactValue).toBeCloseTo(10.7692, 3); // NICHT 10,77
  });

  it("1T/2T-Maßkette: 9 Segmente, abwechselnd Zinken(1T)/Schwalbe(2T)", () => {
    const kette = dims.filter((d) => d.kind === "teil").sort((a, b) => a.a.x - b.a.x);
    expect(kette).toHaveLength(9); // 5 Zinken + 4 Schwalben
    expect(kette.map((d) => d.label)).toEqual([
      "1T", "2T", "1T", "2T", "1T", "2T", "1T", "2T", "1T",
    ]);
    // Schwalbe (2T) ist doppelt so breit wie Zinken (1T).
    const zinken = kette[0]!.exactValue;
    const schwalbe = kette[1]!.exactValue;
    expect(schwalbe).toBeCloseTo(2 * zinken, 6);
  });

  it("Maßketten-Positionen kommen aus den exakten divisions (kein Rundungsdrift)", () => {
    const kette = dims.filter((d) => d.kind === "teil").sort((a, b) => a.a.x - b.a.x);
    // Erstes Segment startet bei 0, letztes endet exakt bei B=140.
    expect(kette[0]!.a.x).toBeCloseTo(0, 6);
    expect(kette[kette.length - 1]!.b.x).toBeCloseTo(140, 6);
  });

  it("Zinkenschräge als STEIGUNGSDREIECK (1 quer : 6 laengs), nicht senkrechtes Mass", () => {
    const s = byId("dim-slope");
    expect(s.label).toBe("1 : 6");
    expect(s.exactValue).toBeCloseTo(3.3333, 3);
    expect(s.triangle).toBeDefined();
    const [p1, p2, p3] = s.triangle!;
    // Senkrecht-Schenkel (laengs) = 6 × quer-Schenkel.
    const laengs = Math.abs(p2.y - p1.y);
    const quer = Math.abs(p3.x - p2.x);
    expect(laengs).toBeCloseTo(6 * quer, 6);
  });

  it("Stirn-Modus: Maßkette liegt an der Stirnkante (y=0)", () => {
    const kette = dims.filter((d) => d.kind === "teil");
    expect(kette.every((d) => d.a.y === 0)).toBe(true);
  });

  it("jedes Mass hat ein vollstaendiges Erklaerfeld (was/wie/wozu/Fehler)", () => {
    for (const d of dims) {
      expect(d.explanation.was.length).toBeGreaterThan(5);
      expect(d.explanation.wie.length).toBeGreaterThan(5);
      expect(d.explanation.wozu.length).toBeGreaterThan(5);
      expect(d.explanation.fehler.length).toBeGreaterThan(5);
      expect(Array.isArray(d.phases)).toBe(true);
    }
  });

  it("zeigt pro Lernschritt nur passende Maße (Spec §15)", () => {
    const messen = dims.filter((d) => d.phases.includes("messen"));
    expect(messen.map((d) => d.id).sort()).toEqual([
      "dim-board-thickness",
      "dim-board-width",
    ]);
    // In "messen" noch KEINE Maßkette.
    expect(messen.some((d) => d.kind === "teil")).toBe(false);
  });
});
