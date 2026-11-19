import { describe, it, expect } from "vitest";
import {
  buildBlumClipTopTuerLayout,
  buildBlumMontageplatteSeiteLayout,
} from "./blum-clip-top.js";
import {
  validateLayout,
  mirrorLayout,
  mayRenderDrillPoints,
  openQuestions,
  resolveDrillY,
} from "./validate.js";

describe("Blum CLIP top — Unterschrank-Tür 600 × 720", () => {
  const l = buildBlumClipTopTuerLayout(600, 720);
  const p = (id: string) => l.points.find((x) => x.id === id)!;

  it("besteht den Validator", () => {
    expect(validateLayout(l)).toEqual([]);
  });

  it("zwei Töpfe Ø35, je zwei Schrauben", () => {
    expect(l.points.filter((x) => x.diameter === 35)).toHaveLength(2);
    expect(l.points).toHaveLength(6);
  });

  it("Flanschschrauben 9,5 von der Kante weg, ±22,5 längs (Blum CAD)", () => {
    expect(p("schraube.oben.a").x - p("topf.oben").x).toBe(9.5);
    expect(p("topf.oben").y - p("schraube.oben.a").y).toBe(22.5);
    expect(p("schraube.oben.b").y - p("topf.oben").y).toBe(22.5);
  });

  it("unteres Scharnier ist ab Unterkante bemaßt", () => {
    expect(resolveDrillY(p("topf.unten"), 720)).toBe(620);
  });

  it("bleibt ENTWURF, solange Bernhard die Lage nicht bestätigt hat", () => {
    expect(l.status).toBe("entwurf");
    expect(mayRenderDrillPoints(l)).toBe(false);
    expect(openQuestions(l).map((o) => o.pointId)).toEqual(["topf.oben", "topf.unten"]);
  });

  it("spiegelt für Anschlag rechts", () => {
    const r = mirrorLayout(l);
    expect(r.anschlag).toBe("rechts");
    expect(r.points.find((x) => x.id === "topf.oben")!.x).toBe(600 - 22.5);
  });

  it("lehnt eine zu niedrige Tür ab", () => {
    expect(() => buildBlumClipTopTuerLayout(600, 200)).toThrow();
  });
});

describe("Blum Montageplatte 173L6100 — Korpusseite", () => {
  const l = buildBlumMontageplatteSeiteLayout(560);

  it("besteht den Validator, Lochreihe 37, Abstand 32", () => {
    expect(validateLayout(l)).toEqual([]);
    expect(l.points.every((x) => x.x === 37)).toBe(true);
    const [a, b] = l.points;
    expect(b!.y - a!.y).toBe(32);
  });

  it("ist immer ENTWURF (Plattenhöhe nicht belegt)", () => {
    expect(mayRenderDrillPoints(l)).toBe(false);
  });
});
