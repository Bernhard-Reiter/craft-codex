import { describe, it, expect } from "vitest";
import {
  zinkenTeilung,
  teilungsKette,
  schraegeInfo,
  papierRechnung,
  pruefeZinkenEingabe,
} from "../src/geometry/zinken-teilung.js";
import { method1Mittellinie } from "../src/geometry/construction.js";

// Buchbeispiel (österreichisches Fachkunde-Lehrbuch Tischler, Kap. 4.1):
// B = 140 mm, D = 20 mm. Erwartete Werte exakt gerechnet, nicht gerundet.
describe("Zinkenteilung — Buchbeispiel B 140 / D 20", () => {
  const t = zinkenTeilung(140, 20);

  it("AZS-Rohwert 140/(1,7·20) = 4,1176… → Vorschlag 4", () => {
    expect(t.layout.AZS_raw).toBeCloseTo(140 / 34, 10);
    expect(t.layout.AZS_raw).toBeCloseTo(4.12, 2);
    expect(t.azsVorschlag).toBe(4);
    expect(t.layout.AZS).toBe(4);
    expect(t.azsFestgelegt).toBe(false);
  });

  it("AZT = 3·4 + 1 = 13", () => {
    expect(t.layout.AZT).toBe(13);
  });

  it("T = 140/13 = 10,769… (Anzeige 10,8)", () => {
    expect(t.layout.T).toBeCloseTo(10.769230769, 8);
    expect(t.layout.T.toFixed(1)).toBe("10.8");
  });

  it("2T exakt 21,54 (nicht 21,6 — das ist die Papier-Rundung)", () => {
    expect(t.layout.schwalbeBreite).toBeCloseTo(21.538461538, 8);
    expect(t.layout.schwalbeBreite.toFixed(2)).toBe("21.54");
    expect(t.layout.schwalbeBreite.toFixed(1)).toBe("21.5");
  });

  it("Hilfsdreieck 6T exakt 64,6 (Buch auf Papier ≈ 65)", () => {
    expect(t.hilfsdreieck.versatz).toBeCloseTo(t.layout.T, 10);
    expect(t.hilfsdreieck.laenge).toBeCloseTo(64.615384615, 8);
  });

  it("Kette: 5 Zinken (2 Randzinken) + 4 Schwalben, geht genau auf B auf", () => {
    const arten = t.segmente.map((s) => s.art);
    expect(arten).toEqual([
      "randzinken", "schwalbe", "zinken", "schwalbe", "zinken",
      "schwalbe", "zinken", "schwalbe", "randzinken",
    ]);
    expect(t.summe).toBeCloseTo(140, 9);
    expect(t.segmente.at(-1)!.bis).toBeCloseTo(140, 9);
  });

  it("offen: BL 0, SL = D", () => {
    expect(t.blatt).toEqual({ BL: 0, SL: 20 });
  });
});

describe("Papier-Rechnung des Buchs (T zuerst auf 0,1 gerundet)", () => {
  it("T 10,8 → 2T 21,6 → 6T 64,8", () => {
    const p = papierRechnung(zinkenTeilung(140, 20));
    expect(p.T).toBe(10.8);
    expect(p.zweiT).toBe(21.6);
    expect(p.hilfsLaenge).toBe(64.8);
  });
});

describe("Variante 3 Schwalben (vom Lehrling festgelegt)", () => {
  const t = zinkenTeilung(140, 20, { azs: 3 });
  it("AZT = 3·3 + 1 = 10, T = 14", () => {
    expect(t.layout.AZS).toBe(3);
    expect(t.layout.AZT).toBe(10);
    expect(t.layout.T).toBeCloseTo(14, 10);
    expect(t.azsFestgelegt).toBe(true);
    expect(t.azsVorschlag).toBe(4);
    expect(t.summe).toBeCloseTo(140, 9);
  });
});

describe("weniger Schwalben: B/(2·D)", () => {
  it("140/(2·20) = 3,5 → Vorschlag 4 (gerundet), Faktor 2", () => {
    const t = zinkenTeilung(140, 20, { dichte: "weit" });
    expect(t.faktor).toBe(2);
    expect(t.layout.AZS_raw).toBeCloseTo(3.5, 10);
    expect(t.layout.AZS).toBe(4);
  });
  it("Referenz B 120 / D 20 weit → AZS 3, AZT 10, T 12", () => {
    const t = zinkenTeilung(120, 20, { dichte: "weit" });
    expect(t.layout.AZS).toBe(3);
    expect(t.layout.AZT).toBe(10);
    expect(t.layout.T).toBeCloseTo(12, 10);
  });
});

describe("halbverdeckt: Blattl = 1/4 D", () => {
  it("D 20 → BL 5, SL 15", () => {
    const t = zinkenTeilung(140, 20, { blattAnteil: 0.25 });
    expect(t.blatt.BL).toBeCloseTo(5, 10);
    expect(t.blatt.SL).toBeCloseTo(15, 10);
  });
});

describe("Schräge: echter Winkel, nicht mit »10–14°« gleichgesetzt", () => {
  it("1:6 = 9,46° — liegt NICHT im Bereich 10–14°", () => {
    const s = schraegeInfo(6);
    expect(s.grad).toBeCloseTo(9.4623, 3);
    expect(s.imGradBereich10bis14).toBe(false);
  });
  it("1:8 = 7,13°", () => {
    const s = schraegeInfo(8);
    expect(s.grad).toBeCloseTo(7.125, 3);
    expect(s.imGradBereich10bis14).toBe(false);
  });
  it("1:5 = 11,31° liegt im Bereich", () => {
    expect(schraegeInfo(5).imGradBereich10bis14).toBe(true);
  });
  it("Buchbeispiel trägt den echten Winkel", () => {
    expect(zinkenTeilung(140, 20).schraege.grad).toBeCloseTo(9.4623, 3);
  });
});

describe("Kette — Invarianten", () => {
  it.each([1, 2, 5, 9])("AZS %i: 2·AZS+1 Segmente, Zinken außen", (n) => {
    const k = teilungsKette(10, n);
    expect(k).toHaveLength(2 * n + 1);
    expect(k[0]!.art).toBe("randzinken");
    expect(k.at(-1)!.art).toBe("randzinken");
    expect(k.filter((s) => s.art === "schwalbe")).toHaveLength(n);
    expect(k.at(-1)!.bis).toBeCloseTo(10 * (3 * n + 1), 9);
  });
});

describe("Eingabeprüfung", () => {
  it("gültiges Buchbeispiel → keine Fehler", () => {
    expect(pruefeZinkenEingabe(140, 20)).toEqual([]);
  });
  it("D größer als halbe Breite", () => {
    expect(pruefeZinkenEingabe(40, 25)).toContain("dicke_zu_gross");
  });
  it("NaN und Grenzen", () => {
    expect(pruefeZinkenEingabe(Number.NaN, 20)).toContain("breite_ungueltig");
    expect(pruefeZinkenEingabe(140, 4)).toContain("dicke_ungueltig");
    expect(pruefeZinkenEingabe(140, 20, 0)).toContain("azs_ungueltig");
    expect(pruefeZinkenEingabe(140, 20, 2.5)).toContain("azs_ungueltig");
  });
});

describe("method1Mittellinie — azs-Option bleibt additiv", () => {
  it("ohne azs unverändert", () => {
    expect(method1Mittellinie(140, 20).AZS).toBe(4);
  });
  it("azs wird gerundet und mindestens 1", () => {
    expect(method1Mittellinie(140, 20, { azs: 0 }).AZS).toBe(1);
    expect(method1Mittellinie(140, 20, { azs: 5 }).AZT).toBe(16);
  });
});
