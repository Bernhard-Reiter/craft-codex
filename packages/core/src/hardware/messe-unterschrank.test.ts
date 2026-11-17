import { describe, it, expect } from "vitest";
import {
  MESSE_UNTERSCHRANK,
  buildMesseUnterschrankSeiteLayout,
} from "./messe-unterschrank.js";
import { buildBlumClipTopTuerLayout } from "./blum-clip-top.js";
import { validateLayout, mayRenderDrillPoints, openQuestions } from "./validate.js";

describe("Messe-Unterschrank 600 · 1 Tür · 1 Schubkasten", () => {
  const v = MESSE_UNTERSCHRANK;

  it("Fronten aus Korpus minus Fugen (2 außen je Kante, 2 Mitte)", () => {
    expect(v.tuer.breite).toBe(596);
    expect(v.tuer.hoehe + 2 + v.schubkastenFront.hoehe).toBe(846);
  });

  it("Tür passt für zwei CLIP-top-Scharniere", () => {
    const t = buildBlumClipTopTuerLayout(v.tuer.breite, v.tuer.hoehe);
    expect(validateLayout(t)).toEqual([]);
  });

  const s = buildMesseUnterschrankSeiteLayout();

  it("Korpusseite besteht den Validator, bleibt aber ENTWURF", () => {
    expect(validateLayout(s)).toEqual([]);
    expect(s.status).toBe("entwurf");
    expect(mayRenderDrillPoints(s)).toBe(false);
  });

  it("MOVENTO: fünf Schraubpunkte auf einer Linie 19 + 38 über der Unterkante", () => {
    const m = s.points.filter((p) => p.stepId === "M1.schiene_schrauben");
    expect(m.map((p) => p.x)).toEqual([37, 243, 261, 293, 357]);
    expect(new Set(m.map((p) => `${p.yRef}:${p.y}`))).toEqual(new Set(["unterkante:57"]));
  });

  it("untere Montageplatte sitzt auf der unteren Scharnierhöhe der Tür", () => {
    const u = s.points.filter((p) => p.id.startsWith("platte.unten"));
    const mitte = (u[0]!.y + u[1]!.y) / 2;
    expect(mitte).toBe(2 + v.tuer.hoehe - 100);
  });

  it("jede Annahme ist als offene Frage sichtbar", () => {
    expect(openQuestions(s)).toHaveLength(s.points.length);
  });
});
