import { describe, it, expect } from "vitest";
import {
  computePins,
  generateMarkings,
  validateDovetailParams,
  DEFAULT_DOVETAIL_PARAMS,
  type DovetailParams,
} from "../src/geometry/index.js";

const P: DovetailParams = { ...DEFAULT_DOVETAIL_PARAMS };

describe("computePins", () => {
  it("returns pinCount pins for valid params", () => {
    const pins = computePins({ ...P, pinCount: 5 });
    expect(pins).toHaveLength(5);
  });

  it("returns empty array for pinCount=0", () => {
    expect(computePins({ ...P, pinCount: 0 })).toEqual([]);
  });

  it("pins are sorted left-to-right (X ascending)", () => {
    const pins = computePins({ ...P, pinCount: 5 });
    for (let i = 1; i < pins.length; i++) {
      expect(pins[i]!.narrowLeft_mm).toBeGreaterThan(
        pins[i - 1]!.narrowLeft_mm,
      );
    }
  });

  it("flare offset matches ratio (1:6 → 9.46°)", () => {
    const pins = computePins({ ...P, ratio: 6 });
    const pin = pins[0]!;
    const narrowWidth = pin.narrowRight_mm - pin.narrowLeft_mm;
    const wideWidth = pin.wideRight_mm - pin.wideLeft_mm;
    expect(wideWidth).toBeGreaterThan(narrowWidth);
    const expectedFlare = P.thickness_mm * Math.tan(Math.atan(1 / 6)) * 2;
    expect(wideWidth - narrowWidth).toBeCloseTo(expectedFlare, 5);
  });

  it("uniform distribution: gaps between pins are equal", () => {
    const pins = computePins({ ...P, pinCount: 4, distribution: "uniform" });
    const gaps: number[] = [];
    for (let i = 1; i < pins.length; i++) {
      gaps.push(pins[i]!.narrowLeft_mm - pins[i - 1]!.narrowRight_mm);
    }
    const first = gaps[0]!;
    gaps.forEach((g) => expect(g).toBeCloseTo(first, 5));
  });

  it("asymmetric_left distribution shifts pins leftward as index grows", () => {
    const pins = computePins({
      ...P,
      pinCount: 3,
      distribution: "asymmetric_left",
    });
    const uniformPins = computePins({
      ...P,
      pinCount: 3,
      distribution: "uniform",
    });
    expect(pins[2]!.narrowLeft_mm).toBeLessThan(uniformPins[2]!.narrowLeft_mm);
  });
});

describe("generateMarkings", () => {
  it("anreissen → streichmass + mittellinie + 1 Schwalben-Kontur pro Pin", () => {
    const m = generateMarkings("anreissen", { ...P, pinCount: 5 });
    expect(m.find((x) => x.id === "streichmass_brettstaerke")).toBeDefined();
    expect(m.find((x) => x.id === "mittellinie")).toBeDefined();
    const konturen = m.filter((x) => x.id.startsWith("schwalbe_pin_"));
    expect(konturen).toHaveLength(5);
    // Volle Trapez-Kontur = geschlossene Polyline (5 Punkte).
    expect(konturen[0]!.points).toHaveLength(5);
  });

  it("saegen → 2 cut lines per pin", () => {
    const m = generateMarkings("saegen", { ...P, pinCount: 5 });
    expect(m).toHaveLength(10);
    expect(m.every((x) => x.color === "#FF3030")).toBe(true);
  });

  it("stemmen → single stop-line", () => {
    const m = generateMarkings("stemmen", P);
    expect(m).toHaveLength(1);
    expect(m[0]!.id).toBe("stemm_stopp_linie");
  });

  it("passen → transfer lines colored blue", () => {
    const m = generateMarkings("passen", { ...P, pinCount: 5 });
    expect(m).toHaveLength(5);
    expect(m.every((x) => x.color === "#0066FF")).toBe(true);
  });

  it("pruefen → soll geometry green", () => {
    const m = generateMarkings("pruefen", { ...P, pinCount: 5 });
    expect(m).toHaveLength(1);
    expect(m[0]!.color).toBe("#00CC00");
  });

  it("all marking points are 3D tuples", () => {
    const m = generateMarkings("anreissen", { ...P, pinCount: 3 });
    m.forEach((line) => {
      line.points.forEach((p) => {
        expect(p).toHaveLength(3);
        expect(p.every((n) => typeof n === "number")).toBe(true);
      });
    });
  });
});

describe("validateDovetailParams", () => {
  it("accepts default params", () => {
    expect(validateDovetailParams(DEFAULT_DOVETAIL_PARAMS).ok).toBe(true);
  });

  it("rejects too thin board", () => {
    const r = validateDovetailParams({ ...P, thickness_mm: 3 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/thickness_mm < 5/);
  });

  it("rejects ratio < 4", () => {
    const r = validateDovetailParams({ ...P, ratio: 3 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/ratio < 4/);
  });

  it("rejects ratio > 10", () => {
    const r = validateDovetailParams({ ...P, ratio: 12 });
    expect(r.ok).toBe(false);
  });

  it("rejects pinCount > 12", () => {
    const r = validateDovetailParams({ ...P, pinCount: 15 });
    expect(r.ok).toBe(false);
  });
});
