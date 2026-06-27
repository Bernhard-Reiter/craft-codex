import { describe, it, expect } from "vitest";
import { buildAnreissFlow, istLinieSichtbar } from "./anreiss-flow";

describe("buildAnreissFlow (Methode 1, B=140, D=20)", () => {
  const flow = buildAnreissFlow(140, 20);

  it("liefert das Lehrbuch-Layout (4 Schwalben, 13 Teile)", () => {
    expect(flow.layout.AZS).toBe(4);
    expect(flow.layout.AZT).toBe(13);
  });

  it("hat die 7 Anreiss-Phasen in Reihenfolge", () => {
    expect(flow.schritte.map((s) => s.id)).toEqual([
      "messen",
      "schwalbenzahl",
      "teile",
      "streichmass",
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

  it("Mess-/Rechen-Schritte zeigen noch keine Brett-Kontur (progressiv)", () => {
    // messen + schwalbenzahl: noch gar nichts; teile: die Mittellinie erscheint,
    // auf der danach geteilt wird.
    for (const id of ["messen", "schwalbenzahl"] as const) {
      const s = flow.schritte.find((x) => x.id === id)!;
      expect(s.zeigeLinien).toEqual([]);
    }
    const teile = flow.schritte.find((x) => x.id === "teile")!;
    expect(teile.zeigeLinien).toEqual(["mittellinie"]);
  });

  it("Streichmaß-Schritt zeigt genau die Streichmaß-Linie", () => {
    const s = flow.schritte.find((x) => x.id === "streichmass")!;
    expect(istLinieSichtbar(s, "streichmass_brettstaerke")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_0")).toBe(false);
  });

  it("Markieren-Schritt zeigt Mittellinie + Schwalben-Konturen (Praefix-Match)", () => {
    const s = flow.schritte.find((x) => x.id === "markieren")!;
    expect(istLinieSichtbar(s, "mittellinie")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_0")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_3")).toBe(true);
  });

  it("Fertig-Schritt zeigt alle Anrisslinien zusammen", () => {
    const s = flow.schritte.find((x) => x.id === "fertig")!;
    expect(istLinieSichtbar(s, "streichmass_brettstaerke")).toBe(true);
    expect(istLinieSichtbar(s, "schwalbe_pin_1")).toBe(true);
  });
});
