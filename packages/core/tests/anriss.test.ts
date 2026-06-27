import { describe, it, expect } from "vitest";
import { buildDovetailAnriss } from "../src/geometry/index.js";

/**
 * Verifiziert das neutrale Anriss-Datenmodell gegen die Lehrbuch-/Spec-Zahlen
 * (B=140, D=20, Methode Mittellinie → 4 Schwalben, 13 Teile).
 */
describe("buildDovetailAnriss (B=140, D=20, mittellinie)", () => {
  const A = buildDovetailAnriss(140, 20);

  it("liefert das Lehrbuch-Layout", () => {
    expect(A.layout.AZS).toBe(4);
    expect(A.layout.AZT).toBe(13);
    expect(A.layout.T).toBeCloseTo(10.7692, 3);
    expect(A.flankOffset).toBeCloseTo(3.3333, 3);
  });

  it("teilt in 4 Schwalben (keep) und 5 Abfall-Zinken (remove)", () => {
    expect(A.tails).toHaveLength(4);
    expect(A.wastes).toHaveLength(5);
    expect(A.tails.every((t) => t.materialState === "keep")).toBe(true);
    expect(A.wastes.every((w) => w.materialState === "remove")).toBe(true);
  });

  it("erzeugt genau die Teilungspositionen der Spec-Tabelle", () => {
    const expected = [
      0, 10.769, 32.308, 43.077, 64.615, 75.385, 96.923, 107.692, 129.231, 140,
    ];
    expect(A.divisions).toHaveLength(expected.length);
    A.divisions.forEach((d, i) => expect(d).toBeCloseTo(expected[i]!, 2));
  });

  it("Schwalbe ist an der Stirnkante breit, an der Grundlinie schmäler (Spec-Polygon)", () => {
    // tail-00 = Segment [1T,3T] = [10.769, 32.308]
    const t0 = A.tails[0]!;
    const [tl, tr, br, bl] = t0.polygon;
    expect(tl!.x).toBeCloseTo(10.769, 2);
    expect(tl!.y).toBe(0);
    expect(tr!.x).toBeCloseTo(32.308, 2);
    expect(tr!.y).toBe(0);
    expect(br!.x).toBeCloseTo(28.975, 2); // 32.308 − 3.333
    expect(br!.y).toBe(20);
    expect(bl!.x).toBeCloseTo(14.102, 2); // 10.769 + 3.333
    expect(bl!.y).toBe(20);
    // Breite oben (Stirnkante) > Breite unten (Grundlinie)
    const top = tr!.x - tl!.x;
    const bottom = br!.x - bl!.x;
    expect(top).toBeGreaterThan(bottom);
  });

  it("Rand-Abfall hat senkrechte Brettkante und weitet sich zur Grundlinie (Spec-Polygon)", () => {
    // waste-00 = Segment [0,1T] = [0, 10.769]
    const w0 = A.wastes[0]!;
    const [tl, tr, br, bl] = w0.polygon;
    expect(tl!.x).toBe(0);
    expect(tr!.x).toBeCloseTo(10.769, 2);
    expect(br!.x).toBeCloseTo(14.102, 2); // 10.769 + 3.333
    expect(bl!.x).toBe(0); // Brettkante bleibt senkrecht
    // unten breiter als oben
    expect(br!.x - bl!.x).toBeGreaterThan(tr!.x - tl!.x);
  });

  it("Grundlinie läuft im Abstand D quer über das ganze Brett", () => {
    expect(A.baseline.role).toBe("baseline");
    expect(A.baseline.a).toEqual({ x: 0, y: 20 });
    expect(A.baseline.b).toEqual({ x: 140, y: 20 });
    expect(A.baseline.widthMm).toBeLessThan(1); // dünn, keine dicke Box
  });

  it("jede Schwalbe hat zwei schräge Flanken als dünne Anrisslinien", () => {
    expect(A.flanks).toHaveLength(8); // 4 Schwalben × 2 Flanken
    expect(A.flanks.every((f) => f.role === "flank")).toBe(true);
    expect(A.flanks.every((f) => f.widthMm < 1)).toBe(true);
    // Flanke ist schräg: x ändert sich genau um den Versatz über die Tiefe D
    const f = A.flanks[0]!;
    expect(Math.abs(f.b.x - f.a.x)).toBeCloseTo(A.flankOffset, 3);
    expect(Math.abs(f.b.y - f.a.y)).toBe(20);
  });

  it("liefert keine 3D-Rohre — nur 2D-Punkte (x,y in mm)", () => {
    const allPts = [
      ...A.tails.flatMap((t) => t.polygon),
      ...A.wastes.flatMap((w) => w.polygon),
    ];
    allPts.forEach((p) => {
      expect(typeof p.x).toBe("number");
      expect(typeof p.y).toBe("number");
      expect(Object.keys(p).sort()).toEqual(["x", "y"]);
    });
  });
});

describe("buildDovetailAnriss skaliert mit den Brettmaßen", () => {
  it("schmaleres Brett → weniger Schwalben, Polygone bleiben im Brett", () => {
    const A = buildDovetailAnriss(100, 20);
    expect(A.tails.length).toBeGreaterThanOrEqual(1);
    const xs = A.tails.flatMap((t) => t.polygon.map((p) => p.x));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(100 + 1e-6);
  });
});
