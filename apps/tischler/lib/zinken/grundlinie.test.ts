import { describe, it, expect } from "vitest";

/**
 * P1 · E2 auch im Bild (T6g, D6): Am Zinkenbrett wird die Grundlinie nur auf
 * den beiden Flächen gerissen — zwei Linien, keine über die Kanten.
 * Koordinaten wie ZinkenWerkstueck3D: x entlang der Breite B, y = Höhe
 * (Grundlinie bei y = 0), z durch die Dicke (Außenfläche z ≈ 0, Innenfläche z ≈ D).
 */

async function ladeGrundlinie() {
  try {
    return { mod: await import("./grundlinie"), fehler: undefined as unknown };
  } catch (e) {
    return { mod: undefined, fehler: e as unknown };
  }
}

describe("P1 · Grundlinie Zinkenbrett nur auf den Flächen (T6g)", () => {
  it.each([
    [140, 20],
    [200, 18],
  ])("B=%i, D=%i: genau zwei Linien, je eine pro Fläche, keine über die Kanten", async (B, D) => {
    const { mod, fehler } = await ladeGrundlinie();
    expect(fehler, `grundlinie.ts nicht ladbar: ${String(fehler)}`).toBeUndefined();
    if (!mod) return;
    const linien = mod.grundlinieZinkenbrett(B, D);
    expect(linien).toHaveLength(2);
    const [aussen, innen] = linien;
    for (const p of [...aussen!, ...innen!]) {
      expect(p[1]).toBe(0);
      expect(p[0]).toBeGreaterThanOrEqual(0);
      expect(p[0]).toBeLessThanOrEqual(B);
    }
    for (const p of aussen!) {
      expect(p[2]).toBeLessThanOrEqual(0);
      expect(p[2]).toBeGreaterThan(-0.5);
    }
    for (const p of innen!) {
      expect(p[2]).toBeGreaterThanOrEqual(D);
      expect(p[2]).toBeLessThan(D + 0.5);
    }
    // jede Linie läuft über die ganze Breite
    expect(Math.min(...aussen!.map((p) => p[0]))).toBe(0);
    expect(Math.max(...aussen!.map((p) => p[0]))).toBe(B);
    expect(Math.min(...innen!.map((p) => p[0]))).toBe(0);
    expect(Math.max(...innen!.map((p) => p[0]))).toBe(B);
  });
});
