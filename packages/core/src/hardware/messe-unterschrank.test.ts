import { describe, it, expect } from "vitest";
import {
  MESSE_UNTERSCHRANK,
  buildMesseUnterschrankSeiteLayout,
} from "./messe-unterschrank.js";
import { buildBlumClipTopTuerLayout, buildBlumMontageplatteSeiteLayout } from "./blum-clip-top.js";
import { validateLayout, mayRenderDrillPoints, openQuestions } from "./validate.js";

describe("Messe-Unterschrank 600 · 1 Tür · 1 Innenschubkasten", () => {
  const v = MESSE_UNTERSCHRANK;

  it("eine Tür über die ganze Höhe wie cody-cad: 596 × 846, keine Schubkastenfront", () => {
    expect(v.tuer).toEqual({ breite: 596, hoehe: 846 });
    expect(v.schubkastenInnen).toBe(true);
    expect(v).not.toHaveProperty("schubkastenFront");
  });

  it("Montageplatten wie cody-cad-Bohrbild: 86/118 + 732/764 (symmetrisch, ab Ober- = ab Unterkante)", () => {
    const y = s.points.filter((p) => p.id.startsWith("platte.")).map((p) => p.y);
    expect(y).toEqual([86, 118, 732, 764]);
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
    expect(m.every((p) => p.offen?.includes("OK Boden Unten") && !p.offen.includes("Unterboden"))).toBe(true);
  });

  it("untere Montageplatte sitzt auf der unteren Scharnierhöhe der Tür", () => {
    const u = s.points.filter((p) => p.id.startsWith("platte.unten"));
    const mitte = (u[0]!.y + u[1]!.y) / 2;
    expect(mitte).toBe(2 + v.tuer.hoehe - 100);
  });

  it("jede Annahme ist als offene Frage sichtbar", () => {
    expect(openQuestions(s)).toHaveLength(s.points.length);
  });

  // Quellen 18.11.: cody-cad blum-173l6100.json »ob Spanplatten- oder Systemschraube, ist nicht belegt«,
  // blum-766h5000s.json nennt nur »schraube« ohne Art -> keine Quelle, Schraubenart bleibt Annahme.
  it("Schraubenart an Montageplatte und MOVENTO bleibt offen, solange keine Quelle sie nennt", () => {
    const layouts = [
      buildMesseUnterschrankSeiteLayout(),
      buildBlumMontageplatteSeiteLayout(MESSE_UNTERSCHRANK.korpus.tiefe),
    ];
    const ankoernen = layouts.flatMap((l) => l.points.filter((p) => p.tool.startsWith("Ankörnen")));
    expect(ankoernen.length).toBeGreaterThan(0);
    for (const p of ankoernen) {
      expect(p.tool).toBe("Ankörnen · Schraube (Art nicht belegt)");
      expect(p.offen).toBeTruthy();
    }
  });
});
