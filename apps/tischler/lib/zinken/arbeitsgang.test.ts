import { describe, it, expect } from "vitest";
import { zinkenTeilung } from "@craft-codex/core";
import { zeitplan } from "./arbeitsgang";

describe("Arbeitsgang-Zeitplan (Buchbeispiel 140/20)", () => {
  const z = zeitplan(zinkenTeilung(140, 20));

  it("8 Schnitte, 4 Abfallstücke", () => {
    expect(z.anzahlSchnitte).toBe(8);
    expect(z.anzahlAbfall).toBe(4);
  });

  it("Sägen: ein Schnitt nach dem anderen, nie tiefer als die Grundlinie", () => {
    expect(z.saegen(0, 0)).toBe(0);
    expect(z.saegen(1 / 16, 0)).toBeCloseTo(0.5, 9);
    expect(z.saegen(1 / 16, 1)).toBe(0);
    expect(z.saegen(1, 7)).toBe(1);
    expect(z.saegen(5, 7)).toBe(1); // geklemmt
    expect(z.aktiverSchnitt(0.99)).toBe(7);
    expect(z.aktiverSchnitt(1)).toBe(7);
  });

  it("Stemmen: erst außen, dann innen, dann das nächste Stück", () => {
    expect(z.aktivesStemmen(0)).toEqual({ index: 0, haelfte: 0 });
    expect(z.aktivesStemmen(1 / 8 + 0.001)).toEqual({ index: 0, haelfte: 1 });
    expect(z.aktivesStemmen(2 / 8 + 0.001)).toEqual({ index: 1, haelfte: 0 });
    expect(z.stemmen(1 / 8, 0, 0)).toBe(1);
    expect(z.stemmen(1 / 8, 0, 1)).toBe(0);
  });

  it("Passen: monoton von 0 bis 1", () => {
    let vorher = -1;
    for (let f = 0; f <= 1.0001; f += 0.1) {
      const p = z.passen(f);
      expect(p).toBeGreaterThanOrEqual(vorher);
      vorher = p;
    }
    expect(z.passen(0)).toBe(0);
    expect(z.passen(1)).toBe(1);
  });
});
