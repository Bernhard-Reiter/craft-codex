import { describe, it, expect } from "vitest";
import { buildAnreissFlow, istLinieSichtbar } from "./anreiss-flow";
import { buildAnreissFlowEn } from "./anreiss-flow.en";

describe("buildAnreissFlow (Methode 1, B=140, D=20)", () => {
  const flow = buildAnreissFlow(140, 20);

  it("liefert das Lehrbuch-Layout (4 Schwalben, 13 Teile)", () => {
    expect(flow.layout.AZS).toBe(4);
    expect(flow.layout.AZT).toBe(13);
  });

  it("hat die 7 Anreiss-Phasen in Reihenfolge — Streichmaß vor dem Teilen (Punkt B)", () => {
    expect(flow.schritte.map((s) => s.id)).toEqual([
      "messen",
      "streichmass",
      "schwalbenzahl",
      "teile",
      "markieren",
      "schraege",
      "fertig",
    ]);
  });

  it("jeder Schritt hat einen Meister-Satz und erlaubt Nachfragen", () => {
    for (const s of flow.schritte) {
      expect(s.meisterSagt.length).toBeGreaterThan(20);
      expect(s.frageErlaubt).toBe(true);
    }
  });

  it("setzt echte berechnete Werte in die Narration ein", () => {
    const schwalben = flow.schritte.find((s) => s.id === "schwalbenzahl")!;
    expect(schwalben.meisterSagt).toContain("4"); // AZS
    expect(schwalben.kennzahl).toBe("4 Schwalben");
    const teile = flow.schritte.find((s) => s.id === "teile")!;
    expect(teile.meisterSagt).toContain("13"); // AZT
  });

  it("schreibt pro Rechen-Schritt die Formel an die Tafel (mit Werten)", () => {
    for (const s of flow.schritte) {
      expect(Array.isArray(s.tafel)).toBe(true);
    }
    const schwalben = flow.schritte.find((s) => s.id === "schwalbenzahl")!;
    expect(schwalben.tafel.join(" ")).toContain("AZS = B / (1,7");
    expect(schwalben.tafel.join(" ")).toContain("4 Schwalben");
    const teile = flow.schritte.find((s) => s.id === "teile")!;
    expect(teile.tafel.join(" ")).toContain("13 Teile");
  });

  it("Messen zeigt noch nichts; nach dem Streichmaß bleibt dessen Linie stehen (progressiv)", () => {
    const messen = flow.schritte.find((x) => x.id === "messen")!;
    expect(messen.zeigeLinien).toEqual([]);
    const schwalben = flow.schritte.find((x) => x.id === "schwalbenzahl")!;
    expect(schwalben.zeigeLinien).toEqual(["streichmass_brettstaerke"]);
    const teile = flow.schritte.find((x) => x.id === "teile")!;
    expect(teile.zeigeLinien).toEqual(["streichmass_brettstaerke", "mittellinie"]);
  });

  it("Streichmaß-Schritt zeigt genau die Streichmaß-Linie", () => {
    const s = flow.schritte.find((x) => x.id === "streichmass")!;
    expect(istLinieSichtbar(s, "streichmass_brettstaerke")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_0")).toBe(false);
  });

  it("Markieren zeigt noch KEINE Schwalbenflanken — die kommen erst bei der Schräge (Punkt B)", () => {
    const s = flow.schritte.find((x) => x.id === "markieren")!;
    expect(istLinieSichtbar(s, "mittellinie")).toBe(true);
    expect(istLinieSichtbar(s, "streichmass_brettstaerke")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_0")).toBe(false);
  });

  it("Schräge zeigt die Schwalbenflanken (Praefix-Match) und sagt, wo gesägt wird", () => {
    const s = flow.schritte.find((x) => x.id === "schraege")!;
    expect(istLinieSichtbar(s, "schwalbe_pin_0")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_3")).toBe(true);
    expect(s.meisterSagt).toContain("Die Risse zeigen dir, wo später gesägt wird.");
    const markieren = flow.schritte.find((x) => x.id === "markieren")!;
    expect(markieren.meisterSagt).not.toContain("wo später gesägt wird");
  });

  it("DE-Fließtext mit richtigen Umlauten/ß (Punkt D)", () => {
    const alles = flow.schritte.map((s) => s.meisterSagt + " " + s.tafel.join(" ")).join(" ");
    expect(alles).not.toMatch(/schaetzen|reissen|Anreissen/);
    expect(alles).toContain("schätzen");
    expect(alles).toContain("Anreißen");
  });

  it("Gradzahl folgt dem Code: 1:6 = atan(1/6) ≈ 9,5° überall gleich (Punkt D)", () => {
    const s = flow.schritte.find((x) => x.id === "schraege")!;
    expect(s.meisterSagt).toContain("rund 9,5 Grad");
    expect(s.tafel.join(" ")).toContain("≈ 9,5°");
  });

  it("Fertig-Schritt zeigt alle Anrisslinien zusammen", () => {
    const s = flow.schritte.find((x) => x.id === "fertig")!;
    expect(istLinieSichtbar(s, "streichmass_brettstaerke")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_1")).toBe(true);
  });
});

describe("buildAnreissFlowEn — EN-Zwilling folgt (Punkt B/D)", () => {
  const de = buildAnreissFlow(140, 20);
  const en = buildAnreissFlowEn(140, 20);

  it("gleiche Reihenfolge und gleiche Linien je Schritt wie DE", () => {
    expect(en.schritte.map((s) => s.id)).toEqual(de.schritte.map((s) => s.id));
    expect(en.schritte.map((s) => s.zeigeLinien)).toEqual(de.schritte.map((s) => s.zeigeLinien));
  });

  it("Gradzahl ≈ 9.5 degrees", () => {
    const s = en.schritte.find((x) => x.id === "schraege")!;
    expect(s.meisterSagt).toContain("9.5 degrees");
    expect(s.tafel.join(" ")).toContain("≈ 9.5°");
  });
});
