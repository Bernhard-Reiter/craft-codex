import { describe, it, expect } from "vitest";
import { solveRigidFrom3Points, type Vec3 } from "@craft-codex/core";
import { ABSTAND_P3_MM, bewerteRegistrierung, zinkenModellPunkte } from "./xr-registrierung";

describe("Zinken-AR-Registrierung", () => {
  const [p1, p2, p3] = zinkenModellPunkte(140, 20);

  it("Punkte liegen auf der Außenfläche und spannen B × 100 mm auf", () => {
    for (const p of [p1, p2, p3]) expect(p[2]).toBeCloseTo(-0.01, 9);
    expect(p2[0] - p1[0]).toBeCloseTo(0.14, 9);
    expect(p1[1] - p3[1]).toBeCloseTo(ABSTAND_P3_MM / 1000, 9);
  });

  it("verschobenes Brett wird exakt wiedergefunden (RMS ≈ 0)", () => {
    const off: Vec3 = [0.3, 0.9, -0.5];
    const welt = [p1, p2, p3].map((p) => [p[0] + off[0], p[1] + off[1], p[2] + off[2]] as Vec3) as [Vec3, Vec3, Vec3];
    const t = solveRigidFrom3Points([p1, p2, p3], welt);
    expect(t).toBeTruthy();
    expect(t!.rmsError).toBeLessThan(1e-9);
    expect(t!.position[0]).toBeCloseTo(0.3, 6);
  });

  it("Güte: ≤ 2 mm gut, ≤ 5 mm grenzwertig, sonst neu", () => {
    expect(bewerteRegistrierung(0.0015)).toBe("gut");
    expect(bewerteRegistrierung(0.004)).toBe("grenzwertig");
    expect(bewerteRegistrierung(0.009)).toBe("neu");
    expect(bewerteRegistrierung(Number.NaN)).toBe("neu");
  });
});
