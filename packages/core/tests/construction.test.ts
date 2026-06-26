import { describe, it, expect } from "vitest";
import {
  method1Mittellinie,
  method2Randverstaerkung,
  method3Grundlinie,
  computeDovetailLayout,
  nearestOdd,
} from "../src/geometry/construction.js";

// Referenzwerte stammen direkt aus dem Lehrbuch (Konstruktionslehre Kap. 4,
// Beispiel B=140 mm, D=20 mm). Wenn diese Tests brechen, weicht die Engine
// von der gelehrten Konstruktion ab → didaktisch falsche Anrisse.
describe("Methode 1 — Mittellinienteilung (Lehrbuch B=140, D=20)", () => {
  const L = method1Mittellinie(140, 20);

  it("AZS = B/(1,7·D) ≈ 4,12 → gerundet 4 Schwalben", () => {
    expect(L.AZS_raw).toBeCloseTo(4.12, 1);
    expect(L.AZS).toBe(4);
  });

  it("AZT = AZS·3 + 1 = 13 Teile", () => {
    expect(L.AZT).toBe(13);
  });

  it("T = B/AZT ≈ 10,77 mm", () => {
    expect(L.T).toBeCloseTo(10.77, 1);
  });

  it("Zinken = 1T, Schwalbe = 2T", () => {
    expect(L.zinkenBreite).toBeCloseTo(L.T, 5);
    expect(L.schwalbeBreite).toBeCloseTo(2 * L.T, 5);
  });

  it("Schraege 1:6 (≈ 9,46°) und ZS = 6·T", () => {
    expect(L.slopeRatio).toBe(6);
    expect(L.slopeDeg).toBeCloseTo(9.46, 1);
    expect(L.ZS).toBeCloseTo(6 * L.T, 5);
  });

  it("offene Zinken: SL = D", () => {
    expect(L.SL).toBe(20);
  });

  it("'weit'-Dichte (B/(2·D)) liefert weniger Schwalben", () => {
    const weit = method1Mittellinie(140, 20, { dichte: "weit" });
    expect(weit.AZS).toBeLessThanOrEqual(L.AZS);
  });
});

describe("Methode 2 — Randzinkenverstaerkung (Lehrbuch B=140, D=20)", () => {
  const L = method2Randverstaerkung(140, 20);

  it("RZV = D/3 ≈ 6,5 mm (auf 0,5 gerundet)", () => {
    expect(L.RZV).toBeCloseTo(6.5, 2);
  });

  it("RB = B − 2·RZV = 127 mm", () => {
    expect(L.RB).toBeCloseTo(127, 1);
  });

  it("AZS = RB/(1,7·D) ≈ 3,7 → 4 Schwalben", () => {
    expect(L.AZS_raw).toBeCloseTo(3.74, 1);
    expect(L.AZS).toBe(4);
  });

  it("ZT = RB/AZS ≈ 31,8 mm", () => {
    expect(L.ZT).toBeCloseTo(31.75, 1);
  });
});

describe("Methode 3 — Ungerade Teile auf Grundlinie (Lehrbuch B=140, D=20)", () => {
  const L = method3Grundlinie(140, 20);

  it("AZT = B/SL = 7 (ungerade)", () => {
    expect(L.AZT).toBe(7);
    expect(L.AZT % 2).toBe(1);
  });

  it("T = B/AZT = 20 mm", () => {
    expect(L.T).toBeCloseTo(20, 5);
  });

  it("halbverdeckt: SL = D − Blattstaerke (BL = D/4)", () => {
    const hv = method3Grundlinie(140, 20, { blattAnteil: 0.25 });
    expect(hv.SL).toBeCloseTo(15, 5); // 20 − 5
  });
});

describe("nearestOdd", () => {
  it("ungerade bleibt", () => {
    expect(nearestOdd(7)).toBe(7);
    expect(nearestOdd(9)).toBe(9);
  });
  it("rundet zur naechsten ungeraden Zahl", () => {
    expect(nearestOdd(9.3)).toBe(9);
    expect(nearestOdd(6)).toBe(7); // gerade → naechste ungerade
    expect(nearestOdd(1.2)).toBe(1);
  });
  it("nie unter 1", () => {
    expect(nearestOdd(0.2)).toBeGreaterThanOrEqual(1);
  });
});

describe("computeDovetailLayout dispatcher", () => {
  it("default = mittellinie", () => {
    expect(computeDovetailLayout(140, 20).method).toBe("mittellinie");
  });
  it("waehlt die angeforderte Methode", () => {
    expect(computeDovetailLayout(140, 20, "randverstaerkung").method).toBe(
      "randverstaerkung",
    );
    expect(computeDovetailLayout(140, 20, "grundlinie").method).toBe(
      "grundlinie",
    );
  });
});
