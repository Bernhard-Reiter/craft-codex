import { describe, it, expect } from "vitest";
import {
  MESSE_LOCHREIHE,
  MESSE_UNTERSCHRANK,
  buildMesseBodenLayout,
  buildMesseHinterstueckLayout,
  messeLochreihePunkte,
  validateLayout,
} from "./index.js";

// Sollwerte = cody-cad korpus.bohrbild für demo_messe_unterschrank_eingaben (Stand 640ba44b).
describe("Messe-Bohrbild aus cody-cad", () => {
  it("Lochreihe, Ø6 Hinterstück und Kupplung Boden wie cody-cad, alle Löcher im Teil", () => {
    const lr = messeLochreihePunkte();
    expect(lr).toHaveLength(50);
    expect([...new Set(lr.map((p) => p.x))]).toEqual([37, 293]);
    expect(Math.min(...lr.map((p) => p.y))).toBe(41.5);
    expect(Math.max(...lr.map((p) => p.y))).toBe(809.5);
    const { tiefe, hoehe } = MESSE_UNTERSCHRANK.korpus;
    expect(lr.every((p) => p.x > 0 && p.x < tiefe && p.y > 0 && p.y < hoehe)).toBe(true);

    const h = buildMesseHinterstueckLayout();
    expect(h.points.map((p) => [p.x, p.y, p.diameter])).toEqual([
      [7, 11, 6],
      [513, 11, 6],
    ]);
    const b = buildMesseBodenLayout();
    expect(b.points.map((p) => p.x)).toEqual([16, 36, 494, 514]);
    expect(b.points.every((p) => p.y === 8 && p.x < b.faceWidth)).toBe(true);

    for (const l of [h, b]) {
      expect(l.points.every((p) => p.offen)).toBe(true);
      expect(validateLayout(l)).toEqual([]);
    }
  });

  it("Druck nennt ein Werkstatt-Wort statt Code (kein »cody-cad«, kein »korpus.«)", () => {
    const layouts = [buildMesseHinterstueckLayout(), buildMesseBodenLayout()];
    const texte = [
      MESSE_LOCHREIHE.annahme,
      ...layouts.flatMap((l) => [l.label, l.source.document, ...l.points.map((p) => p.offen ?? "")]),
    ];
    for (const t of texte) expect(t).not.toMatch(/cody-cad|korpus\./);
    expect(layouts.map((l) => l.source.document)).toEqual([
      "Bohrbild aus der Zeichnung (Messe-Unterschrank)",
      "Bohrbild aus der Zeichnung (Messe-Unterschrank)",
    ]);
  });
});
